import { QueryClient } from "@tanstack/react-query"
import { ZodError } from "zod"

import { ApiError } from "@/lib/http-client"

// Mesmo limite do padrão do TanStack Query; só muda *quando* repetir
const MAX_RETRIES = 3

/**
 * Repete só o que pode dar certo na próxima tentativa (falha de rede, 5xx).
 * 4xx e resposta fora do contrato dariam o mesmo resultado.
 */
export function shouldRetry(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status < 500) return false
  if (error instanceof ZodError) return false
  return failureCount < MAX_RETRIES
}

// Sem staleTime global: cada query decide o seu em movie-queries.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry },
  },
})
