import type { SubmitEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createMovie, deleteMovie, moviesQuery } from "@/lib/api"

export function MovieManager() {
  const queryClient = useQueryClient()

  const { data: movies = [] } = useQuery(moviesQuery)

  const createMutation = useMutation({
    mutationFn: createMovie,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moviesQuery.queryKey }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMovie,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: moviesQuery.queryKey }),
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    createMutation.mutate(
      {
        title: String(data.get("title")),
        genre: String(data.get("genre")),
        year: Number(data.get("year")),
        accent: String(data.get("accent")),
      },
      { onSuccess: () => form.reset() }
    )
  }

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-border p-6">
      <h2 className="text-lg font-semibold">Gerenciar filmes</h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <Input name="title" placeholder="Título" aria-label="Título" required className="min-w-40 flex-1" />
        <Input name="genre" placeholder="Gênero" aria-label="Gênero" required className="w-36" />
        <Input
          name="year"
          type="number"
          placeholder="Ano"
          aria-label="Ano"
          required
          min={1888}
          max={2100}
          className="w-24"
        />
        <Input
          name="accent"
          type="color"
          aria-label="Cor"
          defaultValue="#6366f1"
          className="w-12 cursor-pointer p-1"
        />
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Salvando…" : "Adicionar"}
        </Button>
      </form>

      {createMutation.isError && (
        <p className="text-sm text-red-400">{createMutation.error.message}</p>
      )}

      <ul className="flex flex-col divide-y divide-border">
        {movies.map((movie) => {
          const isDeleting =
            deleteMutation.isPending && deleteMutation.variables === movie.id

          return (
            <li key={movie.id} className="flex items-center gap-3 py-2">
              <span
                aria-hidden
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: movie.accent ?? "#6366f1" }}
              />
              <span className="flex-1 truncate">{movie.title}</span>
              <span className="text-sm text-foreground/50">
                {movie.genre} · {movie.year}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={isDeleting}
                onClick={() => deleteMutation.mutate(movie.id)}
              >
                <Trash2 />
                <span className="sr-only">Excluir {movie.title}</span>
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
