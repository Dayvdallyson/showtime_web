import type { ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { queryClient } from "@/app/query-client"
import { Toaster } from "@/components/ui/toast"

// As Devtools só renderizam em desenvolvimento; o build de produção as descarta
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster>{children}</Toaster>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
