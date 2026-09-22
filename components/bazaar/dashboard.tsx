import { CashFlowTreemap } from "@/components/bazaar/cash-flow-treemap";
import { MoversChart } from "@/components/bazaar/movers-chart";
import { RankedBarChart } from "@/components/bazaar/ranked-bar-chart";
import { RankedTable } from "@/components/bazaar/ranked-table";
import { TimeSeriesChart } from "@/components/bazaar/time-series-chart";
import { formatPct, formatProductId, formatTimestamp, formatVolume } from "@/lib/bazaar/format";
import type { MarketHistory } from "@/lib/bazaar/history";
import type { BazaarOverview } from "@/lib/bazaar/overview";

type DashboardProps = {
  overview: BazaarOverview;
  marketHistory: MarketHistory;
};

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

function MoversTable({ rows }: { rows: MarketHistory["gainers"] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="py-2 pr-3">Product</th>
            <th className="py-2 pr-3">Change</th>
            <th className="py-2 pr-3">Buy now</th>
            <th className="py-2">Weekly vol</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-zinc-100 text-zinc-800 last:border-0 dark:border-zinc-800 dark:text-zinc-200"
            >
              <td className="py-2 pr-3 font-medium">{formatProductId(row.id)}</td>
              <td className="py-2 pr-3 tabular-nums">{formatPct(row.changePct)}</td>
              <td className="py-2 pr-3 tabular-nums">{row.buyPrice.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
              <td className="py-2 tabular-nums">{formatVolume(row.weeklyVolume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dashboard({ overview, marketHistory }: DashboardProps) {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Products" value={overview.productCount.toLocaleString()} />
        <Kpi label="Last bazaar tick" value={formatTimestamp(overview.lastObservedAt)} />
        <Kpi
          label="Last ingest"
          value={
            overview.lastIngestStatus
              ? `${overview.lastIngestStatus} · ${formatTimestamp(overview.lastIngestFinishedAt)}`
              : "—"
          }
        />
        <Kpi
          label="Weekly volume"
          value={formatVolume(overview.totalWeeklyVolume)}
        />
        <Kpi
          label="Weekly cash flow"
          value={`${formatVolume(overview.totalWeeklyCashFlow)} coins`}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Weekly cash flow share
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Each rectangle is that product&apos;s share of estimated weekly coins
          traded (weekly units × current price). Products above 0.1% of cash
          flow are shown individually; everything else is grouped as Other.
          Click a rectangle for details.
        </p>
        <div className="mt-4">
          <CashFlowTreemap data={overview.cashFlowLeaves} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Market cash flow over time
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Estimated weekly coins traded at each stored bazaar tick (weekly units
          × prices at that tick).
        </p>
        <div className="mt-4">
          <TimeSeriesChart
            data={marketHistory.cashFlowSeries}
            format="volume"
            heightClassName="h-72"
            series={[
              { dataKey: "cashFlow", name: "Weekly cash flow", color: "#059669" },
            ]}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Instant-buy movers
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Largest liquid buy-price changes in the {marketHistory.moversWindowLabel},
          among items with weekly volume of at least 10k.
        </p>
        {marketHistory.gainers.length === 0 && marketHistory.losers.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Not enough snapshot history yet to rank movers.
          </p>
        ) : (
          <div className="mt-4 grid gap-6 xl:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Gainers
              </h3>
              <MoversChart rows={marketHistory.gainers} />
              <MoversTable rows={marketHistory.gainers} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Losers
              </h3>
              <MoversChart rows={marketHistory.losers} />
              <MoversTable rows={marketHistory.losers} />
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Most liquid items
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Top 15 by weekly buy + sell volume.
          </p>
          <div className="mt-4">
            <RankedBarChart
              data={overview.topLiquid.map((row) => ({
                id: row.id,
                value: row.weeklyVolume,
              }))}
              valueLabel="Weekly volume"
              format="volume"
              barColor="#059669"
            />
          </div>
          <div className="mt-4">
            <RankedTable rows={overview.topLiquid} />
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Widest liquid spreads
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Top 15 by instant-buy vs instant-sell, among items with weekly volume
            of at least 10k.
          </p>
          <div className="mt-4">
            <RankedBarChart
              data={overview.topSpreads.map((row) => ({
                id: row.id,
                value: row.spreadPct * 100,
              }))}
              valueLabel="Spread %"
              format="percent"
              barColor="#0f766e"
            />
          </div>
          <div className="mt-4">
            <RankedTable rows={overview.topSpreads} />
          </div>
        </article>
      </section>
    </div>
  );
}
