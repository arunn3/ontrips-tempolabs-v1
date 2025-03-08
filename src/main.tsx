import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ItineraryProvider } from "./context/ItineraryContext";
import { Toaster } from "./components/ui/toaster";
import { supabase } from "./lib/supabase";

import { TempoDevtools } from "tempo-devtools";
TempoDevtools.init();

const basename = import.meta.env.BASE_URL;

// We'll handle profile creation during the auth flow
import { createProfilesTable } from "./lib/createProfilesTable";
createProfilesTable().then((success) => {
  console.log(
    success ? "Profiles table check complete" : "Profiles table check failed",
  );
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <ItineraryProvider>
          <App />
          <Toaster />
        </ItineraryProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
