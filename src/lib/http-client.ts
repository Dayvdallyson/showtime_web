import { z } from "zod"

import { env } from "@/config/env"

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
}

/** Erros por campo, no formato que a API devolve: { campo: ["mensagem", ...] } */
export type FieldErrors = Record<string, string[] | undefined>

// Envelope de erro da API: { error: { code, message, details? } }
const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

// Em erro de validação, details traz as mensagens por campo
const fieldErrorsSchema = z.record(z.string(), z.array(z.string()).optional())

// Code usado quando a resposta de erro não segue o envelope (ex.: proxy na frente da API)
const UNKNOWN_ERROR_CODE = "UNKNOWN_ERROR"

/** Resposta HTTP com status de erro (4xx ou 5xx). */
export class ApiError extends Error {
  readonly status: number
  /** Code estável da API, ex.: VALIDATION_ERROR, NOT_FOUND */
  readonly code: string
  /** Erros por campo, só em erros de validação */
  readonly details: FieldErrors | undefined

  constructor(
    status: number,
    code: string,
    message: string,
    details?: FieldErrors
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

/**
 * Faz uma requisição JSON para a API e devolve o corpo ainda sem tipo.
 * Quem chama valida o formato com o schema da feature.
 */
export async function request(
  path: string,
  options: RequestOptions = {}
): Promise<unknown> {
  const { method = "GET", body, signal } = options

  // 1. Enviar
  let response: Response
  try {
    response = await fetch(`${env.VITE_API_URL}${path}`, {
      method,
      signal,
      headers:
        body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // Cancelamento (ex.: query desmontada) segue como está; o resto é falha de rede
    if (signal?.aborted) throw error
    throw new Error("Não foi possível conectar à API", { cause: error })
  }

  // 2. Erro HTTP vira ApiError com o que a API explicou
  if (!response.ok) {
    throw await toApiError(response)
  }

  // 3. Sucesso: 204 não tem corpo
  if (response.status === 204) return undefined
  return response.json()
}

async function toApiError(response: Response) {
  const json: unknown = await response.json().catch(() => null)
  const parsed = errorBodySchema.safeParse(json)

  if (!parsed.success) {
    return new ApiError(
      response.status,
      UNKNOWN_ERROR_CODE,
      `Erro ${response.status}`
    )
  }

  const { code, message, details } = parsed.data.error
  const fieldErrors = fieldErrorsSchema.safeParse(details)
  return new ApiError(
    response.status,
    code,
    message,
    fieldErrors.success ? fieldErrors.data : undefined
  )
}
