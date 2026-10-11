import { useState } from "react"

import { toast } from "@/components/ui/toast"
import { useCreateMovie } from "@/features/movies/api/use-create-movie"
import { useDeleteMovie } from "@/features/movies/api/use-delete-movie"
import { useUpdateMovie } from "@/features/movies/api/use-update-movie"
import { MovieForm } from "@/features/movies/components/movie-form"
import { MovieList } from "@/features/movies/components/movie-list"
import type { Movie, MovieInput } from "@/features/movies/schemas"

export function MovieManager({ movies }: { movies: Movie[] }) {
  const [editing, setEditing] = useState<Movie>()

  const createMovie = useCreateMovie()
  const updateMovie = useUpdateMovie()
  const deleteMovie = useDeleteMovie()

  function handleSubmit(values: MovieInput, changes: Partial<MovieInput>) {
    if (editing) {
      return updateMovie.mutateAsync(
        { id: editing.id, changes },
        {
          onSuccess: (movie) => {
            toast.add({ type: "success", title: `“${movie.title}” atualizado` })
            setEditing(undefined)
          },
          onError: (error) =>
            notifyError("Não foi possível salvar as alterações", error),
        }
      )
    }

    return createMovie.mutateAsync(values, {
      onSuccess: (movie) =>
        toast.add({ type: "success", title: `“${movie.title}” adicionado` }),
      onError: (error) =>
        notifyError("Não foi possível adicionar o filme", error),
    })
  }

  function handleDelete(movie: Movie) {
    if (movie.id === editing?.id) setEditing(undefined)

    deleteMovie.mutate(movie.id, {
      onSuccess: () =>
        toast.add({ type: "success", title: `“${movie.title}” excluído` }),
      onError: (error) =>
        notifyError(`Não foi possível excluir “${movie.title}”`, error),
    })
  }

  return (
    <section
      aria-labelledby="movie-manager-title"
      className="flex flex-col gap-6 rounded-2xl border border-border p-6"
    >
      <h2 id="movie-manager-title" className="text-lg font-semibold">
        {editing ? `Editando “${editing.title}”` : "Gerenciar filmes"}
      </h2>

      <MovieForm
        key={editing?.id ?? "new"}
        movie={editing}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(undefined)}
      />

      <MovieList
        movies={movies}
        editingId={editing?.id}
        onEdit={setEditing}
        onDelete={handleDelete}
      />
    </section>
  )
}

function notifyError(title: string, error: Error) {
  toast.add({ type: "error", title, description: error.message })
}
