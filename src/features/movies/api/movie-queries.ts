import { queryOptions } from "@tanstack/react-query"

import {
  movieKeys,
  type MovieListFilters,
} from "@/features/movies/api/movie-keys"
import { movieService } from "@/features/movies/api/movie-service"

const MOVIE_LIST_STALE_TIME = 5 * 60 * 1000

export function movieListQuery(filters: MovieListFilters) {
  return queryOptions({
    queryKey: movieKeys.list(filters),
    queryFn: ({ signal }) => movieService.list(filters, signal),
    staleTime: MOVIE_LIST_STALE_TIME,
  })
}
