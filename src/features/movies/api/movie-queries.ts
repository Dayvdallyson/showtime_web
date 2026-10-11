import { queryOptions } from "@tanstack/react-query"

import {
  movieKeys,
  type MovieListFilters,
} from "@/features/movies/api/movie-keys"
import { movieService } from "@/features/movies/api/movie-service"

// Os filmes só mudam por este app, e toda mutation invalida a lista na hora.
// Refetch antes disso seria desperdício; 5 min ainda pegam mudanças feitas
// em outra aba quando a janela volta ao foco.
const MOVIE_LIST_STALE_TIME = 5 * 60 * 1000

export function movieListQuery(filters: MovieListFilters) {
  return queryOptions({
    queryKey: movieKeys.list(filters),
    queryFn: ({ signal }) => movieService.list(filters, signal),
    staleTime: MOVIE_LIST_STALE_TIME,
  })
}
