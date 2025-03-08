import React, { useState, useEffect } from "react";
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
  const [lastOpenTime, setLastOpenTime] = useState(0);
  const { user } = useAuth();

  const handleSuccess = () => {
    // Add a small delay before closing the modal to ensure state updates are processed
    setTimeout(() => setOpen(false), 500);
  };

  // Only close modal automatically when user signs in successfully
  // We don't want to close it when user is null and modal is opened for sign-in
  useEffect(() => {
    const wasOpen = open;
    // Only close if we had a user appear (sign in) or disappear (sign out) while modal was open
    if (user && wasOpen) {
      // User just signed in, modal will close via handleSuccess
    } else if (
      user === null &&
      wasOpen &&
      document.activeElement?.tagName !== "INPUT"
    ) {
      // Only close on sign-out, not on initial open when user is null
      // Also don't close if user is typing in an input field
      const modalWasJustOpened = Date.now() - lastOpenTime < 500;
      if (!modalWasJustOpened) {
        setOpen(false);
      }
    }
  }, [user, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (newOpen) {
          setLastOpenTime(Date.now());
        }
        setOpen(newOpen);
      }}
    >
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
