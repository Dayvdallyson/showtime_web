import { z } from "zod"

const DEFAULT_API_URL = "http://localhost:3333"

const envSchema = z.object({
  // No CI a variável pode chegar vazia (repo variable não definida): trata como ausente
  VITE_API_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .url({ protocol: /^https?$/ })
      .default(DEFAULT_API_URL)
      .transform((url) => url.replace(/\/+$/, ""))
  ),
})

const parsed = envSchema.safeParse(import.meta.env)

// Falha na inicialização, com mensagem clara, em vez de quebrar na primeira requisição
if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas:\n${z.prettifyError(parsed.error)}`
  )
}

export const env = parsed.data
