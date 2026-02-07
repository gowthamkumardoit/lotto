import { ReactNode } from "react";
import { AuthRoleGuard } from "@/components/auth/AuthRoleGuard";

export default function SupportLayout({ children }: { children: ReactNode }) {
  return <AuthRoleGuard allow={["admin", "support"]}>{children}</AuthRoleGuard>;
}
