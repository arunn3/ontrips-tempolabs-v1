import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error during auth callback:", error);
      }

      // Redirect to home page after processing the callback
      navigate("/");
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">
          Verifying your account...
        </h2>
        <p className="text-muted-foreground">
          Please wait while we complete the authentication process.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
