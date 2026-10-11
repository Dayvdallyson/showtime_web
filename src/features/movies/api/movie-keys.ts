export type MovieListFilters = {
  search?: string
  page?: number
  pageSize?: number
}

/**
 * Única fonte das query keys de filmes. A hierarquia permite invalidar
 * com precisão: `lists()` atinge todas as listas sem tocar nos detalhes.
 */
export const movieKeys = {
  all: ["movies"] as const,
  lists: () => [...movieKeys.all, "list"] as const,
  list: (filters: MovieListFilters) => [...movieKeys.lists(), filters] as const,
  details: () => [...movieKeys.all, "detail"] as const,
  detail: (id: string) => [...movieKeys.details(), id] as const,
}
