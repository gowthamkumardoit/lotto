"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, Wallet, User, CalendarClock } from "lucide-react";
import DepositReviewDrawer from "@/components/deposits/DepositReviewDrawer";
import type { DepositRequest, DepositRequestWithWallet } from "@/types/deposit";

const deposits: DepositRequest[] = [
  {
    id: "1",
    userName: "Ramesh Kumar",
    userPhone: "9876543210",
    amount: 1000,
    method: "UPI",
    status: "PENDING",
    reference: "UPI123456",
    createdAt: "15 Jan 2026, 11:30 AM",
  },
  {
    id: "2",
    userName: "Admin One",
    userPhone: "9999999999",
    amount: 500,
    method: "BANK",
    status: "COMPLETED",
    reference: "BANK789456",
    createdAt: "14 Jan 2026, 4:10 PM",
  },
];

export default function DepositRequestsPage() {
  const [search, setSearch] = useState("");
  const [selectedDeposit, setSelectedDeposit] =
    useState<DepositRequestWithWallet | null>(null);

  const [openReview, setOpenReview] = useState(false);

  const filtered = deposits.filter(
    (d) =>
      d.userName.toLowerCase().includes(search.toLowerCase()) ||
      d.userPhone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Deposit Requests</h1>
        <p className="text-sm text-muted-foreground">
          Manual wallet deposits initiated by admins
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search user or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-background shadow-sm">
        {/* Card Header */}
        <div className="border-b px-5 py-4">
          <h3 className="text-lg font-semibold">Deposit History</h3>
          <p className="text-sm text-muted-foreground">
            All manual deposit operations
          </p>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pl-6">User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead className="pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((d) => (
              <TableRow
                key={d.id}
                className="hover:bg-muted/50 transition-colors"
              >
                {/* User */}
                <TableCell className="pl-6">
                  <div className="font-medium">{d.userName}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.userPhone}
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell className="font-semibold">₹{d.amount}</TableCell>

                {/* Method */}
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1",
                      d.method === "UPI" &&
                        "bg-emerald-500/15 text-emerald-600",
                      d.method === "BANK" && "bg-sky-500/15 text-sky-600",
                      d.method === "CASH" && "bg-zinc-500/15 text-zinc-600"
                    )}
                  >
                    <Wallet className="mr-1 h-3 w-3" />
                    {d.method}
                  </Badge>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1",
                      d.status === "PENDING" &&
                        "bg-amber-500/15 text-amber-600",
                      d.status === "COMPLETED" &&
                        "bg-emerald-500/15 text-emerald-600",
                      d.status === "REJECTED" && "bg-red-500/15 text-red-600"
                    )}
                  >
                    {d.status}
                  </Badge>
                </TableCell>

                {/* Reference */}
                <TableCell className="text-sm text-muted-foreground">
                  {d.reference}
                </TableCell>

                {/* Time */}
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    {d.createdAt}
                  </div>
                </TableCell>

                {/* Action */}
                <TableCell className="pr-6 text-right">
                  {d.status === "PENDING" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        const depositWithWallet: DepositRequestWithWallet = {
                          ...d,
                          wallet: {
                            available: 2500,
                            locked: 500,
                            bonus: 300,
                          },
                        };

                        setSelectedDeposit(depositWithWallet);
                        setOpenReview(true);
                      }}
                    >
                      Review
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  No deposit requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DepositReviewDrawer
        open={openReview}
        deposit={selectedDeposit}
        onClose={() => setOpenReview(false)}
      />
    </div>
  );
}
