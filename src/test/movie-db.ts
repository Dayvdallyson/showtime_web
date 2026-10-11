import { http, HttpResponse } from "msw/http"

import { env } from "@/config/env"
import type { Movie } from "@/features/movies/schemas"

const MOVIES_URL = `${env.VITE_API_URL}/movies`
// Mesmo padrão da API
const DEFAULT_PAGE_SIZE = 20

let sequence = 0

/** Filme válido no contrato da API; os testes sobrescrevem só o que importa. */
export function buildMovie(overrides: Partial<Movie> = {}): Movie {
  sequence += 1
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: `Filme ${sequence}`,
    genre: "Drama",
    year: 2000,
    synopsis: null,
    posterUrl: null,
    accent: "#6366f1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

/**
 * API fake em memória, no nível da rede, com o mesmo contrato da API real.
 * Cada teste cria a sua, então não há estado compartilhado entre testes.
 */
export function createMovieDb(initial: Movie[] = []) {
  const movies = new Map(initial.map((movie) => [movie.id, movie]))

  const handlers = [
    http.get(MOVIES_URL, ({ request }) => {
      const params = new URL(request.url).searchParams
      const search = params.get("search")?.toLowerCase() ?? ""
      const page = Number(params.get("page") ?? 1)
      const pageSize = Number(params.get("pageSize") ?? DEFAULT_PAGE_SIZE)

      const found = [...movies.values()].filter((movie) =>
        movie.title.toLowerCase().includes(search)
      )
      const start = (page - 1) * pageSize

      return HttpResponse.json({
        data: found.slice(start, start + pageSize),
        meta: { page, pageSize, total: found.length },
      })
    }),

    http.post(MOVIES_URL, async ({ request }) => {
      const input = (await request.json()) as Partial<Movie>
      const movie = buildMovie(input)
      movies.set(movie.id, movie)
      return HttpResponse.json(movie, { status: 201 })
    }),

    http.patch(`${MOVIES_URL}/:id`, async ({ params, request }) => {
      const current = movies.get(String(params.id))
      if (!current) return notFound()

      const changes = (await request.json()) as Partial<Movie>
      const movie = {
        ...current,
        ...changes,
        updatedAt: new Date().toISOString(),
      }
      movies.set(movie.id, movie)
      return HttpResponse.json(movie)
    }),

    http.delete(`${MOVIES_URL}/:id`, ({ params }) => {
      if (!movies.delete(String(params.id))) return notFound()
      return new HttpResponse(null, { status: 204 })
    }),
  ]

  return { movies, handlers }
}

/** Resposta de erro no envelope da API: { error: { code, message, details? } } */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string[]>
) {
  return HttpResponse.json(
    { error: { code, message, ...(details && { details }) } },
    { status }
  )
}

export function notFound() {
  return apiError(404, "NOT_FOUND", "Não encontrado")
}

export { MOVIES_URL }
