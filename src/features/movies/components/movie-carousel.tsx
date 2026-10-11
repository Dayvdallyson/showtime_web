import {
  Carousel3D,
  type Carousel3DItem,
} from "@/components/carousel-3d/carousel-3d"
import type { Movie } from "@/features/movies/schemas"

function toCarouselItem(movie: Movie): Carousel3DItem {
  return {
    id: movie.id,
    title: movie.title,
    subtitle: `${movie.genre} · ${movie.year}`,
    image: movie.posterUrl ?? undefined,
    accent: movie.accent ?? undefined,
  }
}

export function MovieCarousel({ movies }: { movies: Movie[] }) {
  if (movies.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-foreground/60">
        Nenhum filme em destaque ainda. Cadastre o primeiro abaixo.
      </p>
    )
  }

  return <Carousel3D items={movies.map(toCarouselItem)} />
}
