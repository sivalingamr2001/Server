import React, { Suspense } from "react"
import { Loader } from "@/components/Loader"

export const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<Loader />}>
    <Component />
  </Suspense>
)
