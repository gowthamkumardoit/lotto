import { ReactNode } from "react";
import { AuthRoleGuard } from "@/components/auth/AuthRoleGuard";

export default function OpsLayout({ children }: { children: ReactNode }) {
  return <AuthRoleGuard allow={["admin", "manager"]}>{children}</AuthRoleGuard>;
}
