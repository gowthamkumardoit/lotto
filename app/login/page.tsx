"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLoginPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to admin dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [loading, user, router]);

  if (loading) {
    return null; // or a loader
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Admin Login</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage lottery operations
          </p>
        </div>

        {/* Google Login */}
        <Button className="w-full" onClick={loginWithGoogle}>
          Sign in with Google
        </Button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center">
          Only authorized administrators are allowed access.
        </p>
      </div>
    </div>
  );
}
