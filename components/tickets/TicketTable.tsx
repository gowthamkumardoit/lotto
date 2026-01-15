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
import { cn } from "@/lib/utils";

type TicketStatus = "PENDING" | "WON" | "LOST";
type TicketType = "2D" | "3D" | "4D";

type Ticket = {
  id: string;
  drawName: string;
  type: TicketType;
  number: string;
  stake: number;
  status: TicketStatus;
  createdAt: string;
};

const mockTickets: Ticket[] = [
  {
    id: "T001",
    drawName: "Evening Draw",
    type: "4D",
    number: "0729",
    stake: 10,
    status: "WON",
    createdAt: "12 Jan 2026 • 5:45 PM",
  },
  {
    id: "T002",
    drawName: "Evening Draw",
    type: "3D",
    number: "384",
    stake: 20,
    status: "LOST",
    createdAt: "12 Jan 2026 • 5:46 PM",
  },
  {
    id: "T003",
    drawName: "Night Draw",
    type: "2D",
    number: "47",
    stake: 10,
    status: "PENDING",
    createdAt: "12 Jan 2026 • 9:10 PM",
  },
];

/* ---------------- Status Pill ---------------- */

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge
      className={cn(
        "rounded-full px-3 py-1 text-xs",
        status === "WON" && "bg-emerald-500/15 text-emerald-600",
        status === "LOST" && "bg-zinc-500/15 text-zinc-500",
        status === "PENDING" && "bg-amber-500/15 text-amber-600"
      )}
    >
      {status}
    </Badge>
  );
}

/* ---------------- Table ---------------- */

export function TicketTable() {
  if (!mockTickets.length) {
    return (
      <div className="rounded-xl border p-10 text-center text-sm text-muted-foreground">
        No tickets found
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      {/* Header */}
      <div className="border-b px-5 py-4">
        <h3 className="text-lg font-semibold">Tickets</h3>
        <p className="text-sm text-muted-foreground">
          All tickets placed by users
        </p>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="pl-6">Ticket</TableHead>
            <TableHead>Draw</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Stake</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-6">Placed At</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {mockTickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className="hover:bg-muted/50 transition-colors"
            >
              {/* Ticket ID */}
              <TableCell className="pl-6 font-mono text-xs">
                {ticket.id}
              </TableCell>

              {/* Draw */}
              <TableCell className="font-medium">{ticket.drawName}</TableCell>

              {/* Type */}
              <TableCell>
                <Badge variant="outline" className="rounded-full px-3">
                  {ticket.type}
                </Badge>
              </TableCell>

              {/* Number */}
              <TableCell className="font-semibold tracking-wider">
                {ticket.number}
              </TableCell>

              {/* Stake */}
              <TableCell>₹{ticket.stake}</TableCell>

              {/* Status */}
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>

              {/* Time */}
              <TableCell className="pr-6 text-sm text-muted-foreground">
                {ticket.createdAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
