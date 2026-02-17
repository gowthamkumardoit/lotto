/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Slot = {
  id: string;
  digits: number;
  sales: number;
  configSnapshot: any;
};

export default function SlotSimulationPage() {
  const params = useParams();

  const slotId =
    typeof params.slotId === "string"
      ? params.slotId
      : Array.isArray(params.slotId)
        ? params.slotId[0]
        : undefined;

  const [slot, setSlot] = useState<Slot | null>(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [ticketsPerTick, setTicketsPerTick] = useState(1);
  const [soldSet, setSoldSet] = useState<Set<string>>(new Set());

  /* ---------------- LOAD SLOT ---------------- */

  useEffect(() => {
    if (!slotId) return;

    async function loadSlot() {
      const snap = await getDoc(doc(db, "digitDrawSlots", slotId as string));
      if (snap.exists()) {
        setSlot({ id: snap.id, ...(snap.data() as any) });
      }
    }

    loadSlot();
  }, [slotId]);

  /* ---------------- LOAD SOLD ---------------- */

  useEffect(() => {
    if (!slotId) return;

    async function loadSold() {
      const q = query(
        collection(db, "digitDrawTickets"),
        where("slotId", "==", slotId),
      );

      const snap = await getDocs(q);

      const existing = new Set<string>();
      snap.forEach((doc) => {
        existing.add(doc.data().number);
      });

      setSoldSet(existing);
    }

    loadSold();
  }, [slotId]);

  /* ---------------- CALCULATIONS ---------------- */

  const totalTickets = useMemo(() => {
    if (!slot) return 0;
    return Math.pow(10, slot.digits);
  }, [slot]);

  const soldCount = soldSet.size;
  const ticketPrice = slot?.configSnapshot?.ticketPrice ?? 0;
  const revenue = soldCount * ticketPrice;

  const sellRatio =
    totalTickets === 0 ? 0 : Math.min((soldCount / totalTickets) * 100, 100);

  /* ---------------- SAFE PURCHASE FUNCTION ---------------- */

  async function purchaseTicket(number: string) {
    if (!slotId) return;

    const slotRef = doc(db, "digitDrawSlots", slotId);
    const ticketRef = doc(db, "digitDrawTickets", `${slotId}_${number}`);

    await runTransaction(db, async (transaction) => {
      const ticketSnap = await transaction.get(ticketRef);

      // Prevent duplicate purchase
      if (ticketSnap.exists()) {
        return;
      }

      const slotSnap = await transaction.get(slotRef);
      if (!slotSnap.exists()) {
        throw new Error("Slot not found");
      }

      const currentSales = slotSnap.data().sales ?? 0;

      // Create ticket
      transaction.set(ticketRef, {
        slotId,
        number,
        simulated: true,
        createdAt: new Date(),
      });

      // Increment sales atomically
      transaction.update(slotRef, {
        sales: currentSales + ticketPrice,
        updatedAt: new Date(),
      });
    });

    setSoldSet((prev) => {
      const newSet = new Set(prev);
      newSet.add(number);
      return newSet;
    });
  }

  /* ---------------- SIMULATION LOOP ---------------- */

  useEffect(() => {
    if (!running || !slot) return;

    const interval = setInterval(async () => {
      const remaining = totalTickets - soldSet.size;

      if (remaining <= 0) {
        setRunning(false);
        return;
      }

      const unsoldPool: string[] = [];

      for (let i = 0; i < totalTickets; i++) {
        const num = i.toString().padStart(slot.digits, "0");
        if (!soldSet.has(num)) {
          unsoldPool.push(num);
        }
      }

      for (let i = 0; i < ticketsPerTick && unsoldPool.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * unsoldPool.length);

        const selected = unsoldPool.splice(randomIndex, 1)[0];

        await purchaseTicket(selected);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [running, speed, ticketsPerTick, slot, totalTickets, soldSet]);

  if (!slot) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-10">
      {/* HEADER */}
      <div className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Simulation Control Panel
        </h1>
        <p className="text-slate-500 mt-2">Demand & exposure modeling engine</p>
      </div>

      {/* KPI GRID */}
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        <MetricCard title="Tickets Sold" value={soldCount} />
        <MetricCard title="Revenue" value={`₹ ${revenue.toLocaleString()}`} />
        <MetricCard title="Total Supply" value={totalTickets} />
        <MetricCard title="Utilization" value={`${sellRatio.toFixed(2)}%`} />
      </div>

      {/* UTILIZATION BAR */}
      <div className="mb-12">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Capacity Usage</span>
          <span>{sellRatio.toFixed(2)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-900 transition-all duration-300"
            style={{ width: `${sellRatio}%` }}
          />
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="flex flex-wrap gap-10 items-end">
          <Button
            onClick={() => setRunning(!running)}
            variant={running ? "destructive" : "default"}
            className="px-8 py-3"
          >
            {running ? "Stop Simulation" : "Start Simulation"}
          </Button>

          <ControlInput
            label="Execution Interval (ms)"
            value={speed}
            onChange={setSpeed}
          />

          <ControlInput
            label="Orders per Cycle"
            value={ticketsPerTick}
            onChange={setTicketsPerTick}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- METRIC CARD ---------------- */

function MetricCard({ title, value }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </div>
  );
}

/* ---------------- CONTROL INPUT ---------------- */

function ControlInput({ label, value, onChange }: any) {
  return (
    <div>
      <p className="text-sm text-slate-500 mb-2">{label}</p>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-slate-300 rounded-lg px-4 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
    </div>
  );
}
