import { http, HttpResponse } from "msw/http"
import { describe, expect, test } from "vitest"

import { env } from "@/config/env"
import { ApiError, request } from "@/lib/http-client"
import { apiError } from "@/test/movie-db"
import { server } from "@/test/server"

const URL = `${env.VITE_API_URL}/ping`

describe("request", () => {
  test("envia JSON e devolve o corpo da resposta", async () => {
    server.use(
      http.post(URL, async ({ request }) => {
        expect(request.headers.get("content-type")).toBe("application/json")
        return HttpResponse.json({ received: await request.json() })
      })
    )

    await expect(
      request("/ping", { method: "POST", body: { a: 1 } })
    ).resolves.toEqual({
      received: { a: 1 },
    })
  })

  test("devolve undefined em 204", async () => {
    server.use(http.delete(URL, () => new HttpResponse(null, { status: 204 })))

    await expect(
      request("/ping", { method: "DELETE" })
    ).resolves.toBeUndefined()
  })

  test("converte erro da API em ApiError com status e campos", async () => {
    server.use(
      http.post(URL, () =>
        apiError(400, "VALIDATION_ERROR", "Dados inválidos", {
          title: ["Obrigatório"],
        })
      )
    )

    const error = await request("/ping", { method: "POST", body: {} }).catch(
      (e) => e
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: { title: ["Obrigatório"] },
    })
  })

  test("ignora details que não são erros por campo", async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json(
          {
            error: { code: "CONFLICT", message: "Conflito", details: "texto" },
          },
          { status: 409 }
        )
      )
    )

    await expect(request("/ping")).rejects.toMatchObject({
      code: "CONFLICT",
      details: undefined,
    })
  })

  test("usa uma mensagem genérica quando o corpo do erro não é o esperado", async () => {
    server.use(http.get(URL, () => new HttpResponse("boom", { status: 502 })))

    await expect(request("/ping")).rejects.toMatchObject({
      status: 502,
      code: "UNKNOWN_ERROR",
      message: "Erro 502",
    })
  })

  test("traduz falha de rede", async () => {
    server.use(http.get(URL, () => HttpResponse.error()))

    await expect(request("/ping")).rejects.toThrow(
      "Não foi possível conectar à API"
    )
  })
})
