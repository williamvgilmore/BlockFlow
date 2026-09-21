import {
  formatCoins,
  formatPct,
  formatProductId,
  formatVolume,
} from "@/lib/bazaar/format";
import type { OverviewRow } from "@/lib/bazaar/overview";

type RankedTableProps = {
  rows: OverviewRow[];
};

export function RankedTable({ rows }: RankedTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-2 pr-3">#</th>
            <th className="py-2 pr-3">Product</th>
            <th className="py-2 pr-3">Buy</th>
            <th className="py-2 pr-3">Sell</th>
            <th className="py-2 pr-3">Spread %</th>
            <th className="py-2">Weekly vol</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className="border-b border-zinc-100 text-zinc-800 last:border-0 dark:border-zinc-800 dark:text-zinc-200"
            >
              <td className="py-2 pr-3 tabular-nums text-zinc-500">{index + 1}</td>
              <td className="py-2 pr-3 font-medium">{formatProductId(row.id)}</td>
              <td className="py-2 pr-3 tabular-nums">{formatCoins(row.buyPrice)}</td>
              <td className="py-2 pr-3 tabular-nums">{formatCoins(row.sellPrice)}</td>
              <td className="py-2 pr-3 tabular-nums">{formatPct(row.spreadPct)}</td>
              <td className="py-2 tabular-nums">{formatVolume(row.weeklyVolume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
