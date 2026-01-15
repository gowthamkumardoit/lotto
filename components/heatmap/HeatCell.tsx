"use client";

type HeatCellProps = {
  number: string;
  amount: number;
  tickets: number;
  maxAmount: number;
};

export function HeatCell({
  number,
  amount,
  tickets,
  maxAmount,
}: HeatCellProps) {
  const getHeatStyle = () => {
    if (amount === 0 || maxAmount === 0) {
      return {
        backgroundColor: "#18181b", // zinc-900
      };
    }

    const ratio = Math.min(amount / maxAmount, 1);

    // Green (120) → Red (0)
    const hue = 120 - ratio * 120;

    return {
      backgroundColor: `hsl(${hue}, 85%, 45%)`,
    };
  };

  const isActive = amount > 0;

  return (
    <div
      style={getHeatStyle()}
      className={`rounded-md p-2 text-center text-xs text-white
        transition-all duration-200
        ${isActive ? "hover:scale-[1.03] hover:shadow-lg" : "opacity-60"}
      `}
    >
      {/* Number */}
      <div className="font-semibold text-sm">{number}</div>

      {/* Tickets */}
      <div className="mt-0.5 text-[11px] opacity-90">{tickets} tickets</div>

      {/* Amount */}
      <div className="text-[11px] opacity-90">₹{amount}</div>
    </div>
  );
}
