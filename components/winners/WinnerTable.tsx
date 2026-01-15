"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const winners = [
  {
    ticketId: "T8891",
    userId: "U123",
    drawName: "Evening Draw",
    type: "4D",
    number: "0729",
    stake: 10,
    multiplier: 9000,
    payout: 90000,
    credited: true,
  },
  {
    ticketId: "T8892",
    userId: "U124",
    drawName: "Evening Draw",
    type: "3D",
    number: "384",
    stake: 20,
    multiplier: 900,
    payout: 18000,
    credited: true,
  },
];

export function WinnerTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Draw</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Number</TableHead>
          <TableHead>Stake</TableHead>
          <TableHead>Multiplier</TableHead>
          <TableHead>Payout</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {winners.map((w) => (
          <TableRow key={w.ticketId}>
            <TableCell className="font-mono text-xs">{w.ticketId}</TableCell>
            <TableCell className="font-mono text-xs">{w.userId}</TableCell>
            <TableCell>{w.drawName}</TableCell>
            <TableCell>
              <Badge variant="outline">{w.type}</Badge>
            </TableCell>
            <TableCell className="font-semibold">{w.number}</TableCell>
            <TableCell>₹{w.stake}</TableCell>
            <TableCell>{w.multiplier}×</TableCell>
            <TableCell className="font-semibold">
              ₹{w.payout.toLocaleString()}
            </TableCell>
            <TableCell>
              {w.credited ? (
                <Badge className="bg-green-600">CREDITED</Badge>
              ) : (
                <Badge variant="destructive">PENDING</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
