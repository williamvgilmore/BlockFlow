import { Dashboard } from "@/components/bazaar/dashboard";
import { getBazaarOverview } from "@/lib/bazaar/overview";

export const dynamic = "force-dynamic";

export default async function Home() {
  const overview = await getBazaarOverview();

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 font-sans dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-7xl">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-emerald-600">
          Block Flow
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Hypixel SkyBlock Bazaar
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-300">
          Market overview from the latest stored bazaar tick.
        </p>

        {overview.productCount === 0 ? (
          <p className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            No bazaar products in the database yet. Start Postgres and run{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
              npm run ingest:once
            </code>{" "}
            to load a snapshot.
          </p>
        ) : (
          <div className="mt-8">
            <Dashboard overview={overview} />
          </div>
        )}
      </main>
    </div>
  );
}
