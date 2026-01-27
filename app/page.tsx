"use client";

import { StatsCard } from "./components/StatsCard";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

type CoinQuote = {
  price: number;
  percent_change_24h: number;
  market_cap: number;
  volume_24h?: number;
};

type Coin = {
  id: number;
  name: string;
  symbol: string;
  cmc_rank: number;
  quote: {
    USD: CoinQuote;
  };
};

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatVolume(value: number): string {
  return formatMarketCap(value);
}

/** Rounded stats display: $1.72T, $89B */
function formatStatsValue(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${Math.round(value / 1e9)}B`;
  if (value >= 1e6) return `$${Math.round(value / 1e6)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

type FearGreed = {
  value: number;
  value_classification: string;
} | null;

type GlobalMetrics = {
  total_market_cap: number;
  total_volume_24h: number;
} | null;

const logoCache = new Map<number, string>();

function formatLastUpdatedUTC(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "medium",
  }) + " UTC";
}

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fearGreed, setFearGreed] = useState<FearGreed>(null);
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics>(null);
  const [logoMap, setLogoMap] = useState<Record<number, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadPrices() {
    setLoading(true);

    try {
      const timestamp = Date.now();
      const [pricesRes, fngRes, globalMetricsRes] = await Promise.all([
        fetch(`/api/prices?t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }),
        fetch(`/api/fear-greed?t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }),
        fetch(`/api/global-metrics?t=${timestamp}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }),
      ]);

      let latestFetchedAt: number | null = null;

      // Handle prices response
      if (pricesRes.ok) {
        try {
          const pricesData = await pricesRes.json();
          const coinList = Array.isArray(pricesData.data) ? pricesData.data : (Array.isArray(pricesData) ? pricesData : []);
          if (coinList.length > 0) {
            setCoins(coinList);
            if (typeof pricesData.fetchedAt === "number") {
              latestFetchedAt = Math.max(latestFetchedAt ?? 0, pricesData.fetchedAt);
            }
            console.log(`[${new Date().toLocaleTimeString()}] Updated ${coinList.length} coins`);
          } else {
            console.warn("Prices response is empty");
          }
        } catch (parseError) {
          console.error("Failed to parse prices JSON:", parseError);
        }
      } else {
        try {
          const errorText = await pricesRes.text();
          console.error("Failed to fetch prices:", pricesRes.status, errorText);
        } catch {
          console.error("Failed to fetch prices:", pricesRes.status);
        }
      }

      // Handle Fear & Greed response
      if (fngRes.ok) {
        try {
          const fng = await fngRes.json();
          if (fng && typeof fng.value === "number") {
            setFearGreed({
              value: fng.value,
              value_classification: fng.value_classification || "Unknown",
            });
            if (typeof fng.fetchedAt === "number") {
              latestFetchedAt = Math.max(latestFetchedAt ?? 0, fng.fetchedAt);
            }
            console.log(`[${new Date().toLocaleTimeString()}] Updated Fear & Greed: ${fng.value} - ${fng.value_classification}`);
          } else {
            console.warn("Invalid Fear & Greed data structure:", fng);
          }
        } catch (parseError) {
          console.error("Failed to parse Fear & Greed JSON:", parseError);
        }
      } else {
        try {
          const errorText = await fngRes.text();
          console.error("Failed to fetch Fear & Greed:", fngRes.status, errorText);
        } catch {
          console.error("Failed to fetch Fear & Greed:", fngRes.status);
        }
      }

      // Handle Global Metrics response
      if (globalMetricsRes.ok) {
        try {
          const metrics = await globalMetricsRes.json();
          if (metrics && typeof metrics.total_market_cap === "number") {
            setGlobalMetrics({
              total_market_cap: metrics.total_market_cap,
              total_volume_24h: metrics.total_volume_24h ?? 0,
            });
            if (typeof metrics.fetchedAt === "number") {
              latestFetchedAt = Math.max(latestFetchedAt ?? 0, metrics.fetchedAt);
            }
            console.log(`[${new Date().toLocaleTimeString()}] Updated Global Metrics`);
          } else {
            console.warn("Invalid Global Metrics data structure:", metrics);
          }
        } catch (parseError) {
          console.error("Failed to parse Global Metrics JSON:", parseError);
        }
      } else {
        try {
          const errorText = await globalMetricsRes.text();
          console.error("Failed to fetch Global Metrics:", globalMetricsRes.status, errorText);
        } catch {
          console.error("Failed to fetch Global Metrics:", globalMetricsRes.status);
        }
      }

      // Set lastUpdated based on the latest fetchedAt timestamp from APIs
      if (latestFetchedAt !== null) {
        setLastUpdated(new Date(latestFetchedAt));
      }
    } catch (error) {
      console.error("Error loading prices:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    sdk.actions.ready();
    const runLoadPrices = () => {
      console.log(`[${new Date().toLocaleTimeString()}] Triggering data refresh...`);
      void loadPrices();
    };
    // Initial load
    const timeout = setTimeout(runLoadPrices, 0);
    // Auto-refresh every 60 seconds
    const interval = setInterval(runLoadPrices, 60000);
    console.log("Auto-refresh interval set to 60 seconds");
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!coins.length) return;
    const missing = coins
      .map((c) => c.id)
      .filter((id) => !logoCache.has(id));
    if (!missing.length) {
      setLogoMap((prev) =>
        Object.keys(prev).length ? prev : Object.fromEntries(logoCache)
      );
      return;
    }
    const ids = missing.slice(0, 200).join(",");
    fetch(`/api/logos?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : Promise.resolve({})))
      .then((data: Record<string, string>) => {
        for (const [id, url] of Object.entries(data)) {
          if (url) logoCache.set(Number(id), url);
        }
        setLogoMap((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data).map(([k, v]) => [Number(k), v])
          ),
        }));
      })
      .catch(() => {});
  }, [coins]);

  return (
    <main className="min-h-screen bg-[#1F1AB2] text-amber-950 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold sm:mb-6 sm:gap-3 sm:text-4xl" style={{ color: "#ffffff" }}>
          <img
            src="/coinscope-logo.png"
            alt=""
            width={48}
            height={48}
            className="h-7 w-7 shrink-0 object-contain sm:h-9 sm:w-9 md:h-11 md:w-11"
            style={{ background: "transparent" }}
          />
          <span>CoinScope</span>
        </h1>

        {/* Stats cards: Market Cap, Fear & Greed, 24h Volume */}
        <div className="mb-4 sm:mb-8">
          <div className="mb-2 flex w-full justify-end">
            <p className="text-[9px] sm:text-[10px]" style={{ color: "#ffffff" }}>
              Last updated: {formatLastUpdatedUTC(lastUpdated)}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Market Cap">
            {loading || !globalMetrics
              ? "—"
              : formatStatsValue(globalMetrics.total_market_cap)}
          </StatsCard>

          <StatsCard title="Fear & Greed">
            {fearGreed === null ? (
              "—"
            ) : (() => {
              const v = fearGreed.value;
              const label = fearGreed.value_classification;
              const labelColor =
                v < 30 ? "#ef4444" : v <= 60 ? "#eab308" : "#22c55e";
              return (
                <>
                  <span className="text-white">{v}</span>
                  <span className="text-white"> — </span>
                  <span style={{ color: labelColor }}>{label}</span>
                </>
              );
            })()}
          </StatsCard>

          <StatsCard title="24h Volume">
            {loading || !globalMetrics
              ? "—"
              : formatStatsValue(globalMetrics.total_volume_24h)}
          </StatsCard>
          </div>
        </div>

        {loading && <p className="text-sm sm:text-base">Loading prices...</p>}

        {!loading && coins.length === 0 && (
          <p className="text-sm sm:text-base">Unable to load prices right now.</p>
        )}

        {!loading && coins.length > 0 && (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-0 overflow-hidden rounded-xl border border-[#2C2C2C] border-collapse bg-[#1A1A1A] shadow-lg sm:rounded-2xl">
            <thead className="bg-[#2C2C2C]">
              <tr style={{ borderBottom: "1px solid #5E5E5E" }}>
                <th className="p-1.5 text-left text-[10px] font-medium sm:p-2 sm:text-xs md:p-3 md:text-sm" style={{ color: "#A0A0A0" }}>
                  Rank
                </th>
                <th className="p-1.5 text-left text-[10px] font-medium sm:p-2 sm:text-xs md:p-3 md:text-sm" style={{ color: "#A0A0A0" }}>
                  Coin
                </th>
                <th className="p-1.5 text-right text-[10px] font-medium sm:p-2 sm:text-xs md:p-3 md:text-sm" style={{ color: "#A0A0A0" }}>
                  Price
                </th>
                <th className="hidden p-1.5 text-right text-[10px] font-medium md:table-cell md:p-3 md:text-sm" style={{ color: "#A0A0A0" }}>
                  Market Cap
                </th>
                <th className="hidden p-1.5 text-right text-[10px] font-medium md:table-cell md:p-3 md:text-sm" style={{ color: "#A0A0A0" }}>
                  24h Vol
                </th>
                <th className="p-1.5 text-right text-[10px] font-medium sm:p-2 sm:text-xs md:p-3 md:text-sm" style={{ color: "#A0A0A0" }}>
                  24h %
                </th>
              </tr>
            </thead>

            <tbody>
              {coins.map((coin) => {
                const change = coin.quote.USD.percent_change_24h;
                const marketCap = coin.quote.USD.market_cap ?? 0;
                const volume24h = coin.quote?.USD?.volume_24h ?? 0;

                const logoUrl = logoMap[coin.id];
                const placeholderLetter = (coin.symbol ?? "?")[0].toUpperCase();
                const isPositive = change >= 0;

                return (
                  <tr
                    key={coin.id}
                    className="align-middle"
                    style={{
                      backgroundColor: "#080E73",
                      borderTop: "1px solid #5E5E5E",
                    }}
                  >
                    <td className="p-1.5 tabular-nums align-middle text-[10px] font-medium sm:p-2 sm:text-xs md:p-3 md:text-sm" style={{ color: "#ffffff" }}>
                      {coin.cmc_rank}
                    </td>

                    <td className="p-1.5 align-middle sm:p-2 md:p-3">
                      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt=""
                            width={28}
                            height={28}
                            className="h-5 w-5 shrink-0 rounded-full sm:h-6 sm:w-6 md:h-7 md:w-7"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-500 text-[9px] font-bold text-white sm:h-6 sm:w-6 sm:text-[10px] md:h-7 md:w-7 md:text-xs"
                            aria-hidden
                          >
                            {placeholderLetter}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span
                            className="text-[10px] font-semibold sm:text-xs md:text-sm"
                            style={{ color: "#ffffff" }}
                          >
                            {coin.name}
                          </span>
                          {" "}
                          <span className="text-[9px] sm:text-[10px] md:text-xs" style={{ color: "#A0A0A0" }}>
                            {coin.symbol}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-1.5 text-right tabular-nums align-middle text-[10px] font-semibold sm:p-2 sm:text-xs md:p-3 md:text-sm" style={{ color: "#ffffff" }}>
                      ${coin.quote.USD.price.toLocaleString(undefined, {
                        minimumFractionDigits: coin.quote.USD.price < 1 ? 4 : 2,
                        maximumFractionDigits: coin.quote.USD.price < 1 ? 4 : 2,
                      })}
                    </td>

                    <td className="hidden p-1.5 text-right tabular-nums align-middle text-[10px] font-semibold md:table-cell md:p-3 md:text-sm" style={{ color: "#ffffff" }}>
                      {formatMarketCap(marketCap)}
                    </td>

                    <td className="hidden p-1.5 text-right tabular-nums align-middle text-[10px] font-semibold md:table-cell md:p-3 md:text-sm" style={{ color: "#ffffff" }}>
                      {formatVolume(volume24h)}
                    </td>

                    <td className="p-1.5 text-right tabular-nums align-middle sm:p-2 md:p-3">
                      <span
                        className="text-[10px] font-semibold sm:text-xs md:text-sm"
                        style={{
                          color: isPositive ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {isPositive ? "▲" : "▼"}
                        {change.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </main>
  );
}

