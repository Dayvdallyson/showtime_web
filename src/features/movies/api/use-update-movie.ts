import { useMutation } from "@tanstack/react-query"

import { movieKeys } from "@/features/movies/api/movie-keys"
import { movieService } from "@/features/movies/api/movie-service"
import type { MovieInput } from "@/features/movies/schemas"

type UpdateMovieVariables = {
  id: string
  changes: Partial<MovieInput>
}

export function useUpdateMovie() {
  return useMutation({
    mutationFn: ({ id, changes }: UpdateMovieVariables) =>
      movieService.update(id, changes),
    onSuccess: (movie, _variables, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({ queryKey: movieKeys.lists() }),
        context.client.invalidateQueries({
          queryKey: movieKeys.detail(movie.id),
        }),
      ]),
  })
}
