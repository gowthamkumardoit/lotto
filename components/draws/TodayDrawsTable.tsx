"use client";

// TEMP mock data
const MOCK_RUNS = [
  {
    id: "run1",
    name: "Dawn Draw",
    time: "06:00",
    status: "COMPLETED",
    sales: 12400,
    result: "42",
  },
  {
    id: "run2",
    name: "Sunrise Draw",
    time: "08:00",
    status: "RUNNING",
    sales: 3200,
    result: null,
  },
];

export function TodayDrawsTable() {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left">Draw</th>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Sales</th>
            <th className="px-4 py-2">Result</th>
            <th className="px-4 py-2 text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          {MOCK_RUNS.map((run) => (
            <tr key={run.id} className="border-t">
              <td className="px-4 py-2">{run.name}</td>
              <td className="px-4 py-2 text-center">{run.time}</td>
              <td className="px-4 py-2 text-center">{run.status}</td>
              <td className="px-4 py-2 text-center">₹{run.sales}</td>
              <td className="px-4 py-2 text-center">{run.result ?? "—"}</td>
              <td className="px-4 py-2 text-right">View</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
