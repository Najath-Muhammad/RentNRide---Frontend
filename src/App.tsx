import { RouterProvider } from "@tanstack/react-router"
import { Suspense } from "react"
import { router } from "./route"
import PageLoader from "./components/pageLoader"
import FcmToastContainer from "./components/common/FcmToastContainer"
import { useFcmInit } from "./hooks/useFcmInit"

function AppContent() {
  useFcmInit();
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      <FcmToastContainer />
    </>
  );
}

export const App = () => {
  return <AppContent />;
}