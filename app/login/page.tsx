"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLoginPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [loading, user, router]);

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* LEFT PANEL – FULL IMAGE */}
      <div className="hidden lg:block w-1/2 relative">
        <img
          src="/images/lucky_raja.png"
          alt="Kuber Lottery"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* RIGHT PANEL – ENRICHED */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/40 to-background" />

        {/* Glow orbs */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md space-y-12">
          {/* BRAND */}
          <div className="text-center space-y-4">
            <img
              src="/images/kuber_lottery.png"
              alt="Kuber Lottery"
              className="mx-auto h-16 w-auto drop-shadow-md"
            />

            <h1 className="text-4xl font-extrabold tracking-tight">
              Kuber Lottery Admin
            </h1>

            <div className="mx-auto h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" />

            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Secure control panel for lottery operations
            </p>
          </div>

          {/* LOGIN CARD */}
          <div className="rounded-2xl border bg-card/80 backdrop-blur-xl p-8 shadow-xl space-y-6">
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-semibold">Administrator Access</h2>
              <p className="text-xs text-muted-foreground">
                Google authentication required
              </p>
            </div>

            <Button className="w-full h-11" onClick={loginWithGoogle}>
              Sign in with Google
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Only approved accounts can access this panel
            </p>
          </div>

          {/* CONTEXT ROW */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Real-time</p>
              <p>Draw Control</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Secure</p>
              <p>Google Auth</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Audited</p>
              <p>Payouts</p>
            </div>
          </div>

          {/* FOOTER */}
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kuber Lottery • Internal Use Only
          </p>
        </div>
      </div>
    </div>
  );
}
