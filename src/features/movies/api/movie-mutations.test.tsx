import { act, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw/http"
import { describe, expect, test } from "vitest"

import { movieKeys } from "@/features/movies/api/movie-keys"
import { movieListQuery } from "@/features/movies/api/movie-queries"
import { useCreateMovie } from "@/features/movies/api/use-create-movie"
import { useDeleteMovie } from "@/features/movies/api/use-delete-movie"
import { useUpdateMovie } from "@/features/movies/api/use-update-movie"
import type { MovieList } from "@/features/movies/schemas"
import {
  apiError,
  buildMovie,
  createMovieDb,
  MOVIES_URL,
} from "@/test/movie-db"
import { createTestQueryClient, renderHookWithProviders } from "@/test/render"
import { server } from "@/test/server"

const LIST_KEY = movieKeys.list({})

/** QueryClient com a lista já em cache, como depois de abrir a página. */
async function clientWithCachedList() {
  const queryClient = createTestQueryClient()
  await queryClient.prefetchQuery(movieListQuery({}))
  return queryClient
}

function cachedMovies(queryClient: ReturnType<typeof createTestQueryClient>) {
  return queryClient.getQueryData<MovieList>(LIST_KEY)
}

function isInvalidated(
  queryClient: ReturnType<typeof createTestQueryClient>,
  queryKey: readonly unknown[]
) {
  return queryClient.getQueryState(queryKey)?.isInvalidated ?? false
}

describe("useCreateMovie", () => {
  test("cria o filme e invalida só as listas", async () => {
    const other = buildMovie()
    server.use(...createMovieDb([other]).handlers)
    const queryClient = await clientWithCachedList()
    queryClient.setQueryData(movieKeys.detail(other.id), other)

    const { result } = renderHookWithProviders(useCreateMovie, queryClient)
    const created = await act(() =>
      result.current.mutateAsync({
        title: "Duna",
        genre: "Ficção",
        year: 2021,
        accent: "#f59e0b",
      })
    )

    expect(created).toMatchObject({ title: "Duna", year: 2021 })
    expect(isInvalidated(queryClient, LIST_KEY)).toBe(true)
    expect(isInvalidated(queryClient, movieKeys.detail(other.id))).toBe(false)
  })
})

describe("useUpdateMovie", () => {
  test("atualiza e invalida as listas e o detalhe do filme editado", async () => {
    const edited = buildMovie({ title: "Duna" })
    const other = buildMovie()
    server.use(...createMovieDb([edited, other]).handlers)
    const queryClient = await clientWithCachedList()
    queryClient.setQueryData(movieKeys.detail(edited.id), edited)
    queryClient.setQueryData(movieKeys.detail(other.id), other)

    const { result } = renderHookWithProviders(useUpdateMovie, queryClient)
    const updated = await act(() =>
      result.current.mutateAsync({
        id: edited.id,
        changes: { title: "Duna: Parte 2" },
      })
    )

    expect(updated.title).toBe("Duna: Parte 2")
    expect(isInvalidated(queryClient, LIST_KEY)).toBe(true)
    expect(isInvalidated(queryClient, movieKeys.detail(edited.id))).toBe(true)
    expect(isInvalidated(queryClient, movieKeys.detail(other.id))).toBe(false)
  })
})

describe("useDeleteMovie", () => {
  test("remove o filme do cache antes da resposta da API", async () => {
    const kept = buildMovie()
    const deleted = buildMovie()
    server.use(...createMovieDb([kept, deleted]).handlers)
    const queryClient = await clientWithCachedList()

    // Segura a resposta do DELETE para observar o estado otimista
    let releaseResponse!: () => void
    const responseReleased = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    server.use(
      http.delete(`${MOVIES_URL}/:id`, async () => {
        await responseReleased
        return new HttpResponse(null, { status: 204 })
      })
    )

    const { result } = renderHookWithProviders(useDeleteMovie, queryClient)
    act(() => result.current.mutate(deleted.id))

    await waitFor(() =>
      expect(cachedMovies(queryClient)).toEqual({
        data: [kept],
        meta: { page: 1, pageSize: 20, total: 1 },
      })
    )
    expect(result.current.isPending).toBe(true)

    releaseResponse()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(cachedMovies(queryClient)?.data).toEqual([kept])
  })

  test("devolve o filme ao cache quando a API falha", async () => {
    const movies = [buildMovie(), buildMovie()]
    server.use(...createMovieDb(movies).handlers)
    const queryClient = await clientWithCachedList()
    server.use(
      http.delete(`${MOVIES_URL}/:id`, () =>
        apiError(500, "INTERNAL_ERROR", "Erro interno")
      )
    )

    const { result } = renderHookWithProviders(useDeleteMovie, queryClient)
    act(() => result.current.mutate(movies[1].id))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe("Erro interno")
    expect(cachedMovies(queryClient)).toEqual({
      data: movies,
      meta: { page: 1, pageSize: 20, total: 2 },
    })
    expect(isInvalidated(queryClient, LIST_KEY)).toBe(true)
  })
})
