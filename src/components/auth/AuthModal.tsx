import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import AuthForm from "./AuthForm";
import UserProfile from "./UserProfile";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  trigger?: React.ReactNode;
}

const AuthModal = ({ trigger = <Button>Sign In</Button> }: AuthModalProps) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const handleSuccess = () => {
    // Close the modal after successful auth
    setTimeout(() => setOpen(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Your Profile" : "Authentication"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Manage your account and settings"
              : "Sign in to your account or create a new one"}
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <UserProfile onSignOut={() => setOpen(false)} />
        ) : (
          <AuthForm onSuccess={handleSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
