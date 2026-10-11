import { useQuery } from "@tanstack/react-query"
import { http, HttpResponse } from "msw/http"
import { describe, expect, test } from "vitest"
import { ZodError } from "zod"

import { movieKeys } from "@/features/movies/api/movie-keys"
import { movieListQuery } from "@/features/movies/api/movie-queries"
import { buildMovie, createMovieDb, MOVIES_URL } from "@/test/movie-db"
import { renderHookWithProviders } from "@/test/render"
import { server } from "@/test/server"
import { waitFor } from "@testing-library/react"

describe("movieListQuery", () => {
  test("busca e valida a lista de filmes", async () => {
    const movie = buildMovie({ title: "Duna" })
    server.use(...createMovieDb([movie]).handlers)

    const { result, queryClient } = renderHookWithProviders(() =>
      useQuery(movieListQuery({}))
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({
      data: [movie],
      meta: { page: 1, pageSize: 20, total: 1 },
    })
    expect(queryClient.getQueryData(movieKeys.list({}))).toEqual(
      result.current.data
    )
  })

  test("envia busca e paginação na URL", async () => {
    let params: URLSearchParams | undefined
    server.use(
      http.get(MOVIES_URL, ({ request }) => {
        params = new URL(request.url).searchParams
        return HttpResponse.json({
          data: [],
          meta: { page: 2, pageSize: 5, total: 0 },
        })
      })
    )

    const { result } = renderHookWithProviders(() =>
      useQuery(movieListQuery({ search: "duna", page: 2, pageSize: 5 }))
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(params?.get("search")).toBe("duna")
    expect(params?.get("page")).toBe("2")
    expect(params?.get("pageSize")).toBe("5")
  })

  test("falha quando a resposta está fora do contrato", async () => {
    server.use(http.get(MOVIES_URL, () => HttpResponse.json([buildMovie()])))

    const { result } = renderHookWithProviders(() =>
      useQuery(movieListQuery({}))
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(ZodError)
  })
})
