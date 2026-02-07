import { ReactNode } from "react";
import { AuthRoleGuard } from "@/components/auth/AuthRoleGuard";

export default function AdminOnlyLayout({ children }: { children: ReactNode }) {
  return <AuthRoleGuard allow={["admin"]}>{children}</AuthRoleGuard>;
}
