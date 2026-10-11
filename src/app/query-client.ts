import { QueryClient } from "@tanstack/react-query"
import { ZodError } from "zod"

import { ApiError } from "@/lib/http-client"

const MAX_RETRIES = 3

export function shouldRetry(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status < 500) return false
  if (error instanceof ZodError) return false
  return failureCount < MAX_RETRIES
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: shouldRetry },
  },
})
