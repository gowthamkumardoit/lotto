import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-sm text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <ShieldAlert className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold tracking-tight">
            Access Restricted
          </h1>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account doesn’t have permission to access this section.
            <br />
            If you believe this is a mistake, please contact an administrator to
            request access.
          </p>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Link>

            <p className="text-xs text-muted-foreground">
              Error code: <span className="font-mono">UNAUTHORIZED_ACCESS</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lucky Raja · Internal System
        </p>
      </div>
    </div>
  );
}
