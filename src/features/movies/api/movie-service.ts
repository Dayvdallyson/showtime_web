import type { MovieListFilters } from "@/features/movies/api/movie-keys"
import {
  movieListSchema,
  movieSchema,
  type MovieInput,
} from "@/features/movies/schemas"
import { request } from "@/lib/http-client"

export const movieService = {
  async list(filters: MovieListFilters, signal?: AbortSignal) {
    const params = new URLSearchParams()
    if (filters.search) params.set("search", filters.search)
    if (filters.page) params.set("page", String(filters.page))
    if (filters.pageSize) params.set("pageSize", String(filters.pageSize))
    const query = params.size > 0 ? `?${params}` : ""

    const body = await request(`/movies${query}`, { signal })
    return movieListSchema.parse(body)
  },

  async create(input: MovieInput) {
    const body = await request("/movies", { method: "POST", body: input })
    return movieSchema.parse(body)
  },

  async update(id: string, changes: Partial<MovieInput>) {
    const body = await request(`/movies/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: changes,
    })
    return movieSchema.parse(body)
  },

  async remove(id: string) {
    await request(`/movies/${encodeURIComponent(id)}`, { method: "DELETE" })
  },
}
