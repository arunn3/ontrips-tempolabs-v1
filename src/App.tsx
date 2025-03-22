import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useRoutes } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import MagazineLayout from "./components/MagazineLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import SharedItinerary from "./components/SharedItinerary";

const AuthCallback = lazy(() => import("./components/auth/AuthCallback"));
import DestinationGallery from "./components/DestinationGallery";
const DestinationDetails = lazy(
  () => import("./components/DestinationDetails"),
);
const OnboardingFlow = lazy(
  () => import("./components/onboarding/OnboardingFlow"),
);
const AccountSettings = lazy(
  () => import("./components/settings/AccountSettings"),
);

function App() {
  // Define Tempo routes using useRoutes if in Tempo environment
  const tempoRoutesElement =
    import.meta.env.VITE_TEMPO === "true" ? useRoutes(routes) : null;

  return (
    <>
      {/* Render Tempo routes first */}
      {tempoRoutesElement}

      <Routes>
        <Route
          path="/auth/callback"
          element={
            <Suspense fallback={<p>Loading auth callback...</p>}>
              <AuthCallback />
            </Suspense>
          }
        />
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
              <Suspense fallback={<p>Loading destination details...</p>}>
                <DestinationDetails />
              </Suspense>
            </MagazineLayout>
          }
        />
        <Route path="/planner" element={<Home />} />
        <Route
          path="/onboarding"
          element={
            <Suspense fallback={<p>Loading onboarding...</p>}>
              <OnboardingFlow />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MagazineLayout>
                <Suspense fallback={<p>Loading settings...</p>}>
                  <AccountSettings />
                </Suspense>
              </MagazineLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shared-itinerary/:shareId"
          element={
            <MagazineLayout>
              <SharedItinerary />
            </MagazineLayout>
          }
        />
        {/* Add explicit route for tempo routes */}
        {import.meta.env.VITE_TEMPO === "true" && (
          <Route path="/tempobook/*" element={<div />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
