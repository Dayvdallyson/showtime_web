import { useMutation } from "@tanstack/react-query"

import { movieKeys } from "@/features/movies/api/movie-keys"
import { movieService } from "@/features/movies/api/movie-service"

export function useCreateMovie() {
  return useMutation({
    mutationFn: movieService.create,
    onSuccess: (_movie, _input, _onMutateResult, context) =>
      context.client.invalidateQueries({ queryKey: movieKeys.lists() }),
  })
}
