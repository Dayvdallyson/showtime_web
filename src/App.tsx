import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import { Carousel3D } from "@/components/carousel-3d"
import { MovieManager } from "@/components/movie-manager"
import { moviesQuery } from "@/lib/api"

function App() {
  const { data: movies, isPending, isError, error } = useQuery(moviesQuery)

  if (isPending) {
    return <Centered>Carregando filmes…</Centered>
  }

  if (isError) {
    return <Centered>Não foi possível carregar os filmes: {error.message}</Centered>
  }

  const items = movies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    subtitle: `${movie.genre} · ${movie.year}`,
    image: movie.posterUrl ?? undefined,
    accent: movie.accent ?? undefined,
  }))

  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-10 bg-background px-4 py-10">
      <Carousel3D items={items} />
      <MovieManager />
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

export default App
