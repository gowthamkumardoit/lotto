"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Role = "admin" | "manager" | "support" | "user";

export function AuthRoleGuard({
  children,
  allow,
}: {
  children: ReactNode;
  allow: Role[];
}) {
  const { user, loading } = useAuth();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      user.getIdTokenResult(true).then((token) => {
        const role = token.claims.role;
        setAuthorized(typeof role === "string" && allow.includes(role as Role));
      });
    }

    if (!loading && !user) {
      setAuthorized(false);
    }
  }, [loading, user, allow]);

  useEffect(() => {
    if (authorized === false) {
      router.replace("/unauthorized");
    }
  }, [authorized, router]);

  // ⏳ Loading
  if (loading || authorized === null) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ❌ Redirecting
  if (authorized === false) return null;

  // ✅ Authorized
  return <>{children}</>;
}
