import { describe, expect, test } from "vitest"
import { z } from "zod"

import { shouldRetry } from "@/app/query-client"
import { ApiError } from "@/lib/http-client"

describe("shouldRetry", () => {
  test("não repete erro 4xx", () => {
    expect(
      shouldRetry(0, new ApiError(404, "NOT_FOUND", "Não encontrado"))
    ).toBe(false)
  })

  test("não repete resposta fora do contrato", () => {
    const error = z.string().safeParse(1).error!
    expect(shouldRetry(0, error)).toBe(false)
  })

  test("repete 5xx e falha de rede até o limite", () => {
    expect(
      shouldRetry(0, new ApiError(503, "SERVICE_UNAVAILABLE", "Indisponível"))
    ).toBe(true)
    expect(shouldRetry(2, new Error("rede"))).toBe(true)
    expect(shouldRetry(3, new Error("rede"))).toBe(false)
  })
})
