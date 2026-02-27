/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { ComposedChart, Area, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSalesAnalytics } from "@/hooks/useSalesAnalytics";
import { usePayoutAnalytics } from "@/hooks/usePayoutAnalytics";
import { useAuditAnalytics } from "@/hooks/useAuditAnalytics";

/* ---------------- DATE HELPERS ---------------- */

type DateRange = "today" | "yesterday" | "last7" | "total" | "custom";
type ProductType = "kuberX" | "kuberGold";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const { name, value, percent } = payload[0];
  const pct = typeof percent === "number" ? percent * 100 : 0;

  return (
    <div className="rounded border bg-background p-2 text-sm shadow">
      <div className="font-medium">{name}</div>
      <div>Tickets: {value}</div>
      <div>{pct.toFixed(1)}%</div>
    </div>
  );
}

function getRange(range: DateRange, customFrom?: string, customTo?: string) {
  const now = new Date();

  switch (range) {
    case "today": {
      const s = startOfDay(now);
      return { from: s, to: now };
    }
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: startOfDay(now) };
    }
    case "last7": {
      const s = new Date(now);
      s.setDate(s.getDate() - 6);
      return { from: startOfDay(s), to: now };
    }
    case "custom": {
      if (!customFrom || !customTo) return null;
      return {
        from: startOfDay(new Date(customFrom)),
        to: new Date(customTo + "T23:59:59"),
      };
    }
    default:
      return null; // total
  }
}
function getDateFromRunId(drawRunId?: string | null): Date | null {
  if (!drawRunId) return null;

  const match = drawRunId.match(/\d{4}-\d{2}-\d{2}/);
  if (!match) return null;

  const d = new Date(match[0]);
  return isNaN(d.getTime()) ? null : d;
}

/* ---------------- PAGE ---------------- */

export default function AdminDashboardPage() {
  const [product, setProduct] = useState<ProductType>("kuberX");
  const [range, setRange] = useState<DateRange>("total");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const rangeObj = useMemo(
    () => getRange(range, fromDate, toDate),
    [range, fromDate, toDate],
  );

  const salesX = useSalesAnalytics("kuberX");
  const payoutX = usePayoutAnalytics("kuberX");
  const auditsX = useAuditAnalytics("kuberX");

  const salesGold = useSalesAnalytics("kuberGold");
  const payoutGold = usePayoutAnalytics("kuberGold");
  const auditsGold = useAuditAnalytics("kuberGold");

  const sales = product === "kuberGold" ? salesGold : salesX;
  const payout = product === "kuberGold" ? payoutGold : payoutX;
  const audits = product === "kuberGold" ? auditsGold : auditsX;

  /* -------- FILTERED DAILY DATA (charts) -------- */

  const filteredDailyData = useMemo(() => {
    let rows = [...sales.dailySalesData];

    if (rangeObj) {
      rows = rows.filter((r) => {
        const d = new Date(r.date);
        return d >= rangeObj.from && d <= rangeObj.to;
      });
    }

    return rows.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [sales.dailySalesData, rangeObj]);

  /* -------- FILTERED KPIs -------- */

const filteredTotals = useMemo(() => {
  let totalSales = 0;
  let totalTickets = 0;
  let totalPayout = 0;

  /* -------- SALES -------- */
  sales.tickets.forEach((t: any) => {
    let d: Date | null = null;

    if (product === "kuberX") {
      d = getDateFromRunId(t.drawRunId);
    } else {
      if (t.createdAt?.toDate) {
        d = t.createdAt.toDate();
      }
    }

    if (!d) return;

    if (rangeObj) {
      if (d < rangeObj.from || d > rangeObj.to) return;
    }

    totalSales += t.amount ?? 0;
    totalTickets += 1;
  });

  /* -------- PAYOUT -------- */
  payout.winners.forEach((w: any) => {
    let d: Date | null = null;

    if (product === "kuberX") {
      d = getDateFromRunId(w.drawRunId);
    } else {
      if (w.createdAt?.toDate) {
        d = w.createdAt.toDate();
      }
    }

    if (!d) return;

    if (rangeObj) {
      if (d < rangeObj.from || d > rangeObj.to) return;
    }

    totalPayout += w.winAmount ?? 0;
  });

  return { totalSales, totalTickets, totalPayout };
}, [sales.tickets, payout.winners, rangeObj, product]);

  const net = filteredTotals.totalSales - filteredTotals.totalPayout;

  /* -------- PIE DATA -------- */

const filteredTicketTypeSplit = useMemo(() => {
  const map: Record<string, number> = { "2D": 0, "3D": 0, "4D": 0 };

  sales.tickets.forEach((t: any) => {
    let d: Date | null = null;

    if (product === "kuberX") {
      d = getDateFromRunId(t.drawRunId);
    } else {
      if (t.createdAt?.toDate) {
        d = t.createdAt.toDate();
      }
    }

    if (!d) return;

    if (rangeObj) {
      if (d < rangeObj.from || d > rangeObj.to) return;
    }

    map[t.type] = (map[t.type] ?? 0) + 1;
  });

  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
  }));
}, [sales.tickets, rangeObj, product]);

  const PIE_COLORS = ["#22c55e", "#3b82f6", "#f97316"];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER + FILTERS */}

      <div className="flex gap-2">
        <RangePill
          label="Kuber X"
          active={product === "kuberX"}
          onClick={() => setProduct("kuberX")}
        />

        <RangePill
          label="Kuber Gold"
          active={product === "kuberGold"}
          onClick={() => setProduct("kuberGold")}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lottery Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Read-only operational & financial overview
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RangePill
            label="Yesterday"
            active={range === "yesterday"}
            onClick={() => setRange("yesterday")}
          />
          <RangePill
            label="Today"
            active={range === "today"}
            onClick={() => setRange("today")}
          />

          <RangePill
            label="Last 7 Days"
            active={range === "last7"}
            onClick={() => setRange("last7")}
          />
          <RangePill
            label="Total"
            active={range === "total"}
            onClick={() => setRange("total")}
          />
          <RangePill
            label="Custom"
            active={range === "custom"}
            onClick={() => setRange("custom")}
          />

          {range === "custom" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </>
          )}

          <Badge variant="destructive">READ ONLY</Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          title="Total Sales"
          value={`₹${filteredTotals.totalSales.toLocaleString()}`}
        />
        <Kpi
          title="Total Tickets"
          value={filteredTotals.totalTickets.toString()}
        />
        <Kpi
          title="Total Payout"
          value={`₹${filteredTotals.totalPayout.toLocaleString()}`}
        />
        <Kpi
          title="Net Result"
          value={`₹${net.toLocaleString()}`}
          positive={net >= 0}
        />
      </div>

      {/* TABS */}
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="audits">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <ComposedChart data={filteredDailyData}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop
                        offset="100%"
                        stopColor="#22c55e"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickMargin={8}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />

                  {/* 💰 Revenue */}
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#22c55e"
                    fill="url(#salesFill)"
                    strokeWidth={2}
                    name="Sales ₹"
                  />

                  {/* 🎟 Tickets */}
                  <Bar
                    dataKey="tickets"
                    barSize={24}
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="Tickets Sold"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          value="tickets"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <Card>
            <CardHeader>
              <CardTitle>Tickets Sold</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <BarChart data={filteredDailyData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Type Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip content={<PieTooltip />} />
                  <Pie
                    data={filteredTicketTypeSplit}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label={({ name, percent }) => {
                      const pct =
                        typeof percent === "number" ? percent * 100 : 0;

                      return `${name} (${pct.toFixed(0)}%)`;
                    }}
                  >
                    {filteredTicketTypeSplit.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits">
          <Card>
            <CardHeader>
              <CardTitle>Draw Run Audit Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {audits.map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between border p-3 rounded"
                >
                  <div>{a.action}</div>
                  <Badge variant="secondary">{a.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Kpi({
  title,
  value,
  positive,
}: {
  title: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-xl font-bold ${positive ? "text-green-500" : ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function RangePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-muted hover:bg-muted/70"
      }`}
    >
      {label}
    </button>
  );
}
