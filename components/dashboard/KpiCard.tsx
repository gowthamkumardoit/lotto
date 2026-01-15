import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export function KpiCard({ title, value, subtitle }: Props) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
