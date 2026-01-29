"use client";

import { StatsCard } from "./components/StatsCard";
import { useEffect, useState } from "react";
import useSWR from "swr";

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

// Fetcher function for SWR
async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(error.error || `Failed to fetch ${url}`);
  }
  return res.json();
}

export default function Home() {
  const [logoMap, setLogoMap] = useState<Record<number, string>>({});

  // SWR hooks with refresh intervals matching server TTLs
  // Prices: 5 minutes TTL
  const {
    data: pricesData,
    error: pricesError,
    isLoading: pricesLoading,
  } = useSWR<{ data: Coin[]; fetchedAt: number }>("/api/prices", fetcher, {
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  // Fear & Greed: 5 minutes TTL
  const {
    data: fngData,
    error: fngError,
    isLoading: fngLoading,
  } = useSWR<{ value: number; value_classification: string; fetchedAt: number }>(
    "/api/fear-greed",
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Global Metrics: 6 hours TTL
  const {
    data: metricsData,
    error: metricsError,
    isLoading: metricsLoading,
  } = useSWR<{
    total_market_cap: number;
    total_volume_24h: number;
    fetchedAt: number;
  }>("/api/global-metrics", fetcher, {
    refreshInterval: 6 * 60 * 60 * 1000, // 6 hours
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const coins = pricesData?.data || [];
  const loading = pricesLoading || fngLoading || metricsLoading;
  const fearGreed: FearGreed =
    fngData && typeof fngData.value === "number"
      ? {
          value: fngData.value,
          value_classification: fngData.value_classification || "Unknown",
        }
      : null;
  const globalMetrics: GlobalMetrics =
    metricsData && metricsData.total_market_cap > 0
      ? {
          total_market_cap: metricsData.total_market_cap,
          total_volume_24h: metricsData.total_volume_24h ?? 0,
        }
      : null;

  // Calculate lastUpdated from the latest fetchedAt
  const timestamps = [
    pricesData?.fetchedAt,
    fngData?.fetchedAt,
    metricsData?.fetchedAt,
  ].filter((t): t is number => typeof t === "number");
  const lastUpdated =
    timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

  // Fetch logos with SWR (1 hour TTL) - limit to 200 IDs
  const coinIds = coins.length > 0 ? coins.slice(0, 200).map((c) => c.id).join(",") : null;
  const {
    data: logosData,
  } = useSWR<Record<string, string> & { fetchedAt?: number }>(
    coinIds ? `/api/logos?ids=${coinIds}` : null,
    fetcher,
    {
      refreshInterval: 60 * 60 * 1000, // 1 hour
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (logosData) {
      // Filter out fetchedAt from logo URLs
      const logoUrls: Record<string, string> = {};
      for (const [id, url] of Object.entries(logosData)) {
        if (id !== "fetchedAt" && typeof url === "string" && url.length > 0) {
          logoUrls[id] = url;
          logoCache.set(Number(id), url);
        }
      }
      setLogoMap((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(logoUrls).map(([k, v]) => [Number(k), v])
        ),
      }));
    }
  }, [logosData]);

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

        {(pricesError || fngError || metricsError) && (
          <p className="text-sm sm:text-base text-red-300">
            Error loading data. Please refresh the page.
          </p>
        )}

        {!loading && coins.length === 0 && !pricesError && (
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

