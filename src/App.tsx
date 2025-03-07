import { Suspense, lazy } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import MagazineLayout from "./components/MagazineLayout";

const AuthCallback = lazy(() => import("./components/auth/AuthCallback"));
const DestinationGallery = lazy(
  () => import("./components/DestinationGallery"),
);
const DestinationDetails = lazy(
  () => import("./components/DestinationDetails"),
);

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <MagazineLayout>
              <DestinationGallery />
            </MagazineLayout>
          }
        />
        <Route
          path="/destination/:id"
          element={
            <MagazineLayout>
              <DestinationDetails />
            </MagazineLayout>
          }
        />
        <Route path="/planner" element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
    </Suspense>
  );
}

export default App;
