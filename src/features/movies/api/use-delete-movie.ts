import { useMutation } from "@tanstack/react-query"

import { movieKeys } from "@/features/movies/api/movie-keys"
import { movieService } from "@/features/movies/api/movie-service"
import type { MovieList } from "@/features/movies/schemas"

/**
 * Exclui com optimistic update: o filme some de todas as listas na hora,
 * volta se a API falhar e, no fim, as listas são buscadas de novo.
 */
export function useDeleteMovie() {
  return useMutation({
    mutationFn: movieService.remove,

    onMutate: async (id: string, context) => {
      // 1. Cancelar refetches em andamento, que sobrescreveriam o optimistic
      await context.client.cancelQueries({ queryKey: movieKeys.lists() })

      // 2. Guardar como as listas estavam, para o rollback
      const previousLists = context.client.getQueriesData<MovieList>({
        queryKey: movieKeys.lists(),
      })

      // 3. Remover o filme de todas as listas em cache
      context.client.setQueriesData<MovieList>(
        { queryKey: movieKeys.lists() },
        (list) => list && withoutMovie(list, id)
      )

      return { previousLists }
    },

    // 4. Se a API falhar, devolver cada lista ao estado anterior
    onError: (_error, _id, onMutateResult, context) => {
      for (const [queryKey, list] of onMutateResult?.previousLists ?? []) {
        context.client.setQueryData(queryKey, list)
      }
    },

    // 5. Com sucesso ou erro, confirmar com o servidor
    onSettled: (_data, _error, _id, _onMutateResult, context) =>
      context.client.invalidateQueries({ queryKey: movieKeys.lists() }),
  })
}

function withoutMovie(list: MovieList, id: string): MovieList {
  const data = list.data.filter((movie) => movie.id !== id)
  const removedCount = list.data.length - data.length
  return { data, meta: { ...list.meta, total: list.meta.total - removedCount } }
}
