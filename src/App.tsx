import { RouterProvider } from "@tanstack/react-router"
import { Suspense } from "react"
import { router } from "./route"
import PageLoader from "./components/pageLoader"

export const App = () => {

    return (
        <Suspense fallback={<PageLoader/>}>
          <RouterProvider router={router}  />
        </Suspense>
      )
}