import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { movieListQuery } from "@/features/movies/api/movie-queries"
import { MovieCarousel } from "@/features/movies/components/movie-carousel"
import { MovieManager } from "@/features/movies/components/movie-manager"

// Carrossel e lista mostram o catálogo numa tela só, sem paginação na interface:
// pede o máximo que a API aceita por página
const MOVIES_PAGE_SIZE = 100

export function MoviesPage() {
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery(
    movieListQuery({ pageSize: MOVIES_PAGE_SIZE })
  )

  if (isPending) {
    return (
      <Centered>
        <p role="status">Carregando filmes…</p>
      </Centered>
    )
  }

  if (isError) {
    return (
      <Centered>
        <div role="alert" className="flex flex-col items-center gap-4">
          <p>Não foi possível carregar os filmes: {error.message}</p>
          <Button
            variant="outline"
            disabled={isRefetching}
            onClick={() => refetch()}
          >
            {isRefetching ? "Tentando…" : "Tentar novamente"}
          </Button>
        </div>
      </Centered>
    )
  }

  const movies = data.data
  const hiddenCount = data.meta.total - movies.length

  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-10 bg-background px-4 py-10">
      <MovieCarousel movies={movies} />
      {hiddenCount > 0 && (
        <p role="status" className="text-center text-sm text-foreground/60">
          Mostrando {movies.length} de {data.meta.total} filmes.
        </p>
      )}
      <MovieManager movies={movies} />
    </main>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 text-sm text-foreground/60">
      {children}
    </main>
  )
}
