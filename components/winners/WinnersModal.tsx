import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Winner } from "@/types/winners";

export function WinnersModal({
  open,
  onClose,
  drawId,
  winners,
}: {
  open: boolean;
  onClose: () => void;
  drawId: string;
  winners: Winner[];
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Winners – {drawId}</DialogTitle>
        </DialogHeader>

        {!Array.isArray(winners) || winners.length === 0 ? (
          <div className="py-6 text-sm text-muted-foreground">
            No winners for this draw
          </div>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Number</th>
                <th className="px-3 py-2">Bet</th>
                <th className="px-3 py-2">Win</th>
              </tr>
            </thead>
            <tbody>
              {winners.map((w, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2">{w.userId}</td>
                  <td className="px-3 py-2">{w.type}</td>
                  <td className="px-3 py-2">{w.number}</td>
                  <td className="px-3 py-2">₹{w.betAmount}</td>
                  <td className="px-3 py-2 font-medium">
                    ₹{w.winAmount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}
