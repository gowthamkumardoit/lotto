/* eslint-disable @typescript-eslint/no-explicit-any */
/* ---------------- UI Helpers ---------------- */

export function CardHeader({
  icon: Icon,
  title,
  description,
  toggle,
}: {
  icon: any;
  title: string;
  description: string;
  toggle: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <div className="font-semibold">{title}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {toggle}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
