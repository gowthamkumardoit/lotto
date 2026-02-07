import AdminShell from "@/components/layout/AdminShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AuthRoleGuard } from "@/components/auth/AuthRoleGuard";
import PlatformConfigBootstrap from "@/components/common/PlatformConfigBootstrap";
import { DrawSoonAlertFromFirestore } from "@/components/common/DrawSoonAlertFromFirestore";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AuthRoleGuard allow={["admin", "manager", "support"]}>
        <AdminShell>
          <PlatformConfigBootstrap />

          {/* ✅ Client-side alert logic */}
          <DrawSoonAlertFromFirestore />

          {children}
        </AdminShell>
      </AuthRoleGuard>
    </AuthGuard>
  );
}
