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
import { createSearchCriteriaTable } from "./lib/createSearchCriteriaTable";

// Import the addEditableColumn function
import { addEditableColumn } from "./lib/addEditableColumn";

// Initialize database tables
Promise.all([
  createProfilesTable(),
  createSearchCriteriaTable(),
  addEditableColumn(),
]).then(([profilesSuccess, searchCriteriaSuccess, editableColumnSuccess]) => {
  console.log(
    profilesSuccess
      ? "Profiles table check complete"
      : "Profiles table check failed",
  );
  console.log(
    searchCriteriaSuccess
      ? "Search criteria table check complete"
      : "Search criteria table check failed",
  );
  console.log(
    editableColumnSuccess
      ? "Editable column added successfully"
      : "Editable column check failed",
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
