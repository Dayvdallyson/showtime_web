import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, renderHook } from "@testing-library/react"

import { Toaster } from "@/components/ui/toast"

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Toaster>{children}</Toaster>
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(
  ui: ReactNode,
  queryClient = createTestQueryClient()
) {
  return { queryClient, ...render(ui, { wrapper: createWrapper(queryClient) }) }
}

export function renderHookWithProviders<Result>(
  hook: () => Result,
  queryClient = createTestQueryClient()
) {
  return {
    queryClient,
    ...renderHook(hook, { wrapper: createWrapper(queryClient) }),
  }
}
