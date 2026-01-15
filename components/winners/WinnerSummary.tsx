import { Card, CardContent } from "@/components/ui/card";

export function WinnerSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Winners</p>
          <p className="text-2xl font-semibold">12</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Total Payout</p>
          <p className="text-2xl font-semibold">₹4,50,000</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Credited Successfully</p>
          <p className="text-2xl font-semibold">100%</p>
        </CardContent>
      </Card>
    </div>
  );
}
