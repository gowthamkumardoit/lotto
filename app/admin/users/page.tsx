"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  Timestamp,
  DocumentSnapshot,
  getCountFromServer,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { User } from "@/types/users";
import { UsersTable } from "@/components/users/UsersTable";
import UserDetailsDrawer from "@/components/users/UserDetailsDrawer";
import { UsersFilters } from "./userFilterSidePanel";

/* ---------------- CONSTANTS ---------------- */

const PAGE_SIZE_OPTIONS = [10, 50, 100];

/* ---------------- PAGE ---------------- */

export default function UsersPage() {
  /* ---------------- TABLE STATE (TANSTACK OWNS THIS) ---------------- */

  const [data, setData] = useState<User[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  /* ---------------- FIRESTORE FETCH ---------------- */

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      /* ---------------- BASE QUERY (FOR COUNT) ---------------- */

      let baseQuery = query(
        collection(db, "users"),
        orderBy(
          sorting[0]?.id ?? "createdAt",
          sorting[0]?.desc ? "desc" : "asc"
        )
      );

      // Column filters
      for (const f of columnFilters) {
        if (f.id === "role") {
          baseQuery = query(baseQuery, where("role", "==", f.value));
        }
        if (f.id === "status") {
          baseQuery = query(baseQuery, where("status", "==", f.value));
        }
      }

      // Global search (phone prefix)
      if (globalFilter) {
        const end =
          globalFilter.slice(0, -1) +
          String.fromCharCode(
            globalFilter.charCodeAt(globalFilter.length - 1) + 1
          );

        baseQuery = query(
          baseQuery,
          where("phone", ">=", globalFilter),
          where("phone", "<", end)
        );
      }

      /* ---------------- TOTAL COUNT ---------------- */

      const countSnap = await getCountFromServer(baseQuery);
      setTotalCount(countSnap.data().count);

      /* ---------------- PAGINATED QUERY ---------------- */

      let q = query(baseQuery, limit(pageSize));

      if (pageIndex > 0 && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snap = await getDocs(q);

      const rows: User[] = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          phone: d.phone,
          role: d.role,
          status: d.status,
          createdAt: (d.createdAt as Timestamp).toDate(),
        };
      });

      setData(rows);
      setLastDoc(snap.docs.at(-1) ?? null);
      setHasMore(snap.docs.length === pageSize);
      setLoading(false);
    }

    fetchData();
  }, [pageIndex, pageSize, sorting, columnFilters, globalFilter]);

  /* ---------------- COLUMNS ---------------- */

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "status", header: "Status" },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }) => row.original.createdAt.toLocaleDateString(),
      },
    ],
    []
  );

  /* ---------------- TABLE ---------------- */

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination: { pageIndex, pageSize },
    },
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    pageCount: hasMore ? pageIndex + 2 : pageIndex + 1,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;

      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  /* ---------------- UI ---------------- */

  return (
    <div className="flex gap-6">
      {/* LEFT FILTER PANEL */}
      <UsersFilters
        filters={columnFilters}
        setFilters={(v) => {
          setPageIndex(0);
          setColumnFilters(v);
        }}
        globalFilter={globalFilter}
        setGlobalFilter={(v) => {
          setPageIndex(0);
          setGlobalFilter(v);
        }}
      />

      {/* RIGHT CONTENT */}
      <div className="flex-1 space-y-6">
        <UsersTable
          table={table}
          loading={loading}
          onSelect={(u) => {
            setSelectedUser(u);
            setOpen(true);
          }}
        />

        {/* FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3 shadow-sm">
          {/* PAGE SIZE */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageIndex(0);
                setPageSize(Number(e.target.value));
              }}
              className="rounded-md border bg-background px-2 py-1 text-sm focus:ring-2 focus:ring-primary/40"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>entries</span>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Total:{" "}
              <span className="font-medium text-foreground">{totalCount}</span>
            </span>

            <button
              onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
              disabled={pageIndex === 0 || loading}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">
                {pageIndex + 1}
              </span>
            </span>

            <button
              onClick={() => hasMore && setPageIndex((p) => p + 1)}
              disabled={!hasMore || loading}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <UserDetailsDrawer
        user={selectedUser}
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
