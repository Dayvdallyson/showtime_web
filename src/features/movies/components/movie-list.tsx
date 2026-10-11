import { Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DEFAULT_ACCENT, type Movie } from "@/features/movies/schemas"
import { cn } from "@/lib/utils"

type MovieListProps = {
  movies: Movie[]
  editingId?: string
  onEdit: (movie: Movie) => void
  onDelete: (movie: Movie) => void
}

export function MovieList({
  movies,
  editingId,
  onEdit,
  onDelete,
}: MovieListProps) {
  return (
    <>
      <p aria-live="polite" className="sr-only">
        {movies.length === 1
          ? "1 filme cadastrado"
          : `${movies.length} filmes cadastrados`}
      </p>

      {movies.length === 0 ? (
        <p className="py-2 text-sm text-foreground/50">
          Nenhum filme cadastrado.
        </p>
      ) : (
        <ul
          aria-label="Filmes cadastrados"
          className="flex flex-col divide-y divide-border"
        >
          {movies.map((movie) => {
            const isEditing = movie.id === editingId

            return (
              <li
                key={movie.id}
                aria-current={isEditing}
                className={cn(
                  "flex items-center gap-3 py-2",
                  isEditing && "bg-foreground/5"
                )}
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: movie.accent ?? DEFAULT_ACCENT }}
                />
                <span className="flex-1 truncate">{movie.title}</span>
                <span className="text-sm text-foreground/50">
                  {movie.genre} · {movie.year}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(movie)}
                >
                  <Pencil />
                  <span className="sr-only">Editar {movie.title}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(movie)}
                >
                  <Trash2 />
                  <span className="sr-only">Excluir {movie.title}</span>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
