import { useMutation } from "@tanstack/react-query"

import { movieKeys } from "@/features/movies/api/movie-keys"
import { movieService } from "@/features/movies/api/movie-service"
import type { MovieList } from "@/features/movies/schemas"

export function useDeleteMovie() {
  return useMutation({
    mutationFn: movieService.remove,

    onMutate: async (id: string, context) => {
      await context.client.cancelQueries({ queryKey: movieKeys.lists() })

      const previousLists = context.client.getQueriesData<MovieList>({
        queryKey: movieKeys.lists(),
      })

      context.client.setQueriesData<MovieList>(
        { queryKey: movieKeys.lists() },
        (list) => list && withoutMovie(list, id)
      )

      return { previousLists }
    },

    onError: (_error, _id, onMutateResult, context) => {
      for (const [queryKey, list] of onMutateResult?.previousLists ?? []) {
        context.client.setQueryData(queryKey, list)
      }
    },

    onSettled: (_data, _error, _id, _onMutateResult, context) =>
      context.client.invalidateQueries({ queryKey: movieKeys.lists() }),
  })
}

function withoutMovie(list: MovieList, id: string): MovieList {
  const data = list.data.filter((movie) => movie.id !== id)
  const removedCount = list.data.length - data.length
  return { data, meta: { ...list.meta, total: list.meta.total - removedCount } }
}
