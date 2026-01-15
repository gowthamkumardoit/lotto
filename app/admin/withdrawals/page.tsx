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
import { Search, Banknote, CalendarClock, Wallet } from "lucide-react";
import WithdrawReviewDrawer from "@/components/withdrawals/WithdrawReviewDrawer";
import type {
  WithdrawalRequest,
  WithdrawalRequestWithWallet,
} from "@/types/withdrawal";

const withdrawals: WithdrawalRequest[] = [
  {
    id: "1",
    userName: "Ramesh Kumar",
    userPhone: "9876543210",
    amount: 1500,
    method: "UPI",
    status: "PENDING",
    destination: "ramesh@upi",
    createdAt: "16 Jan 2026, 10:15 AM",
  },
  {
    id: "2",
    userName: "Blocked User",
    userPhone: "8888888888",
    amount: 800,
    method: "BANK",
    status: "APPROVED",
    destination: "HDFC •••• 2341",
    createdAt: "15 Jan 2026, 6:40 PM",
  },
];

export default function WithdrawalRequestsPage() {
  const [search, setSearch] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState<WithdrawalRequestWithWallet | null>(null);

  const [openReview, setOpenReview] = useState(false);

  const filtered = withdrawals.filter(
    (w) =>
      w.userName.toLowerCase().includes(search.toLowerCase()) ||
      w.userPhone.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Withdrawal Requests</h1>
        <p className="text-sm text-muted-foreground">
          User-initiated wallet withdrawal requests
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
          <h3 className="text-lg font-semibold">Withdrawal History</h3>
          <p className="text-sm text-muted-foreground">
            All withdrawal requests submitted by users
          </p>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="pl-6">User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested At</TableHead>
              <TableHead className="pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((w) => (
              <TableRow
                key={w.id}
                className="hover:bg-muted/50 transition-colors"
              >
                {/* User */}
                <TableCell className="pl-6">
                  <div className="font-medium">{w.userName}</div>
                  <div className="text-xs text-muted-foreground">
                    {w.userPhone}
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell className="font-semibold">₹{w.amount}</TableCell>

                {/* Method */}
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1",
                      w.method === "UPI" &&
                        "bg-emerald-500/15 text-emerald-600",
                      w.method === "BANK" && "bg-sky-500/15 text-sky-600"
                    )}
                  >
                    <Wallet className="mr-1 h-3 w-3" />
                    {w.method}
                  </Badge>
                </TableCell>

                {/* Destination */}
                <TableCell className="text-sm">{w.destination}</TableCell>

                {/* Status */}
                <TableCell>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1",
                      w.status === "PENDING" &&
                        "bg-amber-500/15 text-amber-600",
                      w.status === "APPROVED" &&
                        "bg-emerald-500/15 text-emerald-600",
                      w.status === "REJECTED" && "bg-red-500/15 text-red-600"
                    )}
                  >
                    {w.status}
                  </Badge>
                </TableCell>

                {/* Time */}
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    {w.createdAt}
                  </div>
                </TableCell>

                {/* Action */}
                <TableCell className="pr-6 text-right">
                  {w.status === "PENDING" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        const withdrawalWithWallet: WithdrawalRequestWithWallet =
                          {
                            ...w,
                            wallet: {
                              available: 2000,
                              locked: w.amount,
                              bonus: 300,
                            },
                          };

                        setSelectedWithdrawal(withdrawalWithWallet);
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
                  No withdrawal requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <WithdrawReviewDrawer
        open={openReview}
        withdrawal={selectedWithdrawal}
        onClose={() => setOpenReview(false)}
        onApprove={(withdrawal, note) => {
          console.log("Approve withdrawal", withdrawal.id, note);
        }}
        onReject={(withdrawal, note) => {
          console.log("Reject withdrawal", withdrawal.id, note);
        }}
      />
    </div>
  );
}
