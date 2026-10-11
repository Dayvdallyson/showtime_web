import { queryOptions } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333"

export type Movie = {
  id: string
  title: string
  genre: string
  year: number
  synopsis: string | null
  posterUrl: string | null
  accent: string | null
  createdAt: string
  updatedAt: string
}

export type NewMovie = {
  title: string
  genre: string
  year: number
  accent?: string
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: init.body ? { "content-type": "application/json" } : undefined,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Erro ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

export const moviesQuery = queryOptions({
  queryKey: ["movies"],
  queryFn: ({ signal }) => request<Movie[]>("/movies", { signal }),
})

export function createMovie(movie: NewMovie) {
  return request<Movie>("/movies", {
    method: "POST",
    body: JSON.stringify(movie),
  })
}

export function deleteMovie(id: string) {
  return request<void>(`/movies/${id}`, { method: "DELETE" })
}
