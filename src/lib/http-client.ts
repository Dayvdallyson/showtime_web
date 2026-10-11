import { z } from "zod"

import { env } from "@/config/env"

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
}

export type FieldErrors = Record<string, string[] | undefined>

const errorBodySchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})

const fieldErrorsSchema = z.record(z.string(), z.array(z.string()).optional())

const UNKNOWN_ERROR_CODE = "UNKNOWN_ERROR"

export class ApiError extends Error {
  readonly status: number
  readonly code: string
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

export async function request(
  path: string,
  options: RequestOptions = {}
): Promise<unknown> {
  const { method = "GET", body, signal } = options

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
    if (signal?.aborted) throw error
    throw new Error("Não foi possível conectar à API", { cause: error })
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

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
