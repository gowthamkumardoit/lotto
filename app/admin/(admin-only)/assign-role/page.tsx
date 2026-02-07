/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import {
  assignRoleCallable,
  listRoleAssignmentsCallable,
} from "@/services/assignRoleService";

/* ================= TYPES ================= */

type RoleRow = {
  email: string;
  role: string;
  assignedAt: string | null;
};

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-red-600 text-white",
  manager: "bg-blue-600 text-white",
  support: "bg-amber-500 text-black",
  user: "bg-gray-200 text-gray-900",
};

/* ================= PAGE ================= */

export default function AssignRolePage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RoleRow[]>([]);

  const loadTable = async () => {
    const res: any = await listRoleAssignmentsCallable();
    setRows(res.data.items);
  };

  useEffect(() => {
    loadTable();
  }, []);

  const onSubmit = async () => {
    if (!email || !role) {
      toast.error("Email and role are required");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      await assignRoleCallable({ email, role });

      toast.success("Role assigned", {
        description: `${email} → ${role}`,
      });

      setEmail("");
      setRole("user");
      await loadTable();
    } catch (e: any) {
      toast.error("Failed to assign role", {
        description: e?.message ?? "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<RoleRow>[]>(
    () => [
      {
        header: "Email",
        accessorKey: "email",
      },
      {
        header: "Role",
        cell: ({ row }) => {
          const r = row.original.role;
          return (
            <span
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                ${ROLE_STYLES[r] ?? "bg-gray-300 text-black"}
              `}
            >
              {r.toUpperCase()}
            </span>
          );
        },
      },
      {
        header: "Assigned At",
        cell: ({ row }) =>
          row.original.assignedAt
            ? new Date(row.original.assignedAt).toLocaleString()
            : "—",
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ASSIGN CARD */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Assign Role
          </CardTitle>
          <CardDescription>
            Assign role using email address. Changes are audited.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex gap-2 flex-wrap">
              {["admin", "manager", "support", "user"].map((r) => {
                const selected = role === r;

                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`
                      px-4 py-1.5 rounded-full text-sm font-medium transition
                      ${ROLE_STYLES[r]}
                      ${
                        selected
                          ? "ring-2 ring-offset-2 ring-black"
                          : "opacity-70 hover:opacity-100"
                      }
                    `}
                  >
                    {r.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <Button className="w-full" onClick={onSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Role
          </Button>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Roles</CardTitle>
        </CardHeader>

        <CardContent>
          <table className="w-full border">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="border p-2 text-left">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((r) => (
                <tr key={r.id}>
                  {r.getVisibleCells().map((c) => (
                    <td key={c.id} className="border p-2">
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
