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
  const [logoMap, setLogoMap] = useState<Record<number, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadPrices() {
    setLoading(true);

    const [pricesRes, fngRes] = await Promise.all([
      fetch("/api/prices"),
      fetch("/api/fear-greed"),
    ]);

    const pricesData = await pricesRes.json();
    const coinList = Array.isArray(pricesData) ? pricesData : [];
    setCoins(coinList);

    if (fngRes.ok) {
      const fng = await fngRes.json();
      setFearGreed({
        value: fng.value ?? 0,
        value_classification: fng.value_classification ?? "Unknown",
      });
    } else {
      setFearGreed(null);
    }

    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    sdk.actions.ready();
    const runLoadPrices = () => {
      void loadPrices();
    };
    const timeout = setTimeout(runLoadPrices, 0);
    const interval = setInterval(runLoadPrices, 60000);
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
    <main className="min-h-screen bg-[#1F1AB2] text-amber-950 p-6">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-6 flex items-center gap-3 text-4xl font-bold" style={{ color: "#ffffff" }}>
          <img
            src="/coinscope-logo.png"
            alt=""
            width={48}
            height={48}
            className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
            style={{ background: "transparent" }}
          />
          <span>CoinScope</span>
        </h1>

        {/* Stats cards: Market Cap, Fear & Greed, 24h Volume */}
        <div className="mb-8">
          <div className="mb-2 flex w-full justify-end">
            <p className="text-[10px]" style={{ color: "#ffffff" }}>
              Last updated: {formatLastUpdatedUTC(lastUpdated)}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Market Cap">
            {loading || coins.length === 0
              ? "—"
              : formatStatsValue(
                  coins.reduce(
                    (sum, c) => sum + (c.quote?.USD?.market_cap ?? 0),
                    0
                  )
                )}
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
            {loading || coins.length === 0
              ? "—"
              : formatStatsValue(
                  coins.reduce(
                    (sum, c) => sum + (c.quote?.USD?.volume_24h ?? 0),
                    0
                  )
                )}
          </StatsCard>
          </div>
        </div>

        {loading && <p>Loading prices...</p>}

        {!loading && coins.length === 0 && (
          <p>Unable to load prices right now.</p>
        )}

        {!loading && coins.length > 0 && (
          <table className="w-full overflow-hidden rounded-2xl border border-[#2C2C2C] border-collapse bg-[#1A1A1A] shadow-lg">
            <thead className="bg-[#2C2C2C]">
              <tr style={{ borderBottom: "1px solid #5E5E5E" }}>
                <th className="p-3 text-left text-sm font-medium" style={{ color: "#A0A0A0" }}>
                  Rank
                </th>
                <th className="p-3 text-left text-sm font-medium" style={{ color: "#A0A0A0" }}>
                  Coin
                </th>
                <th className="p-3 text-right text-sm font-medium" style={{ color: "#A0A0A0" }}>
                  Price ($)
                </th>
                <th className="p-3 text-right text-sm font-medium" style={{ color: "#A0A0A0" }}>
                  Market Cap
                </th>
                <th className="p-3 text-right text-sm font-medium" style={{ color: "#A0A0A0" }}>
                  24h Volume
                </th>
                <th className="p-3 text-right text-sm font-medium" style={{ color: "#A0A0A0" }}>
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
                    <td className="p-3 tabular-nums align-middle text-sm font-medium" style={{ color: "#ffffff" }}>
                      {coin.cmc_rank}
                    </td>

                    <td className="p-3 align-middle">
                      <div className="flex items-center gap-2">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 shrink-0 rounded-full"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-500 text-xs font-bold text-white"
                            aria-hidden
                          >
                            {placeholderLetter}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span
                            className="font-semibold"
                            style={{ color: "#ffffff" }}
                          >
                            {coin.name}
                          </span>
                          {" "}
                          <span style={{ color: "#A0A0A0" }}>
                            {coin.symbol}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 text-right tabular-nums align-middle font-semibold" style={{ color: "#ffffff" }}>
                      ${coin.quote.USD.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="p-3 text-right tabular-nums align-middle font-semibold" style={{ color: "#ffffff" }}>
                      {formatMarketCap(marketCap)}
                    </td>

                    <td className="p-3 text-right tabular-nums align-middle font-semibold" style={{ color: "#ffffff" }}>
                      {formatVolume(volume24h)}
                    </td>

                    <td className="p-3 text-right tabular-nums align-middle">
                      <span
                        className="font-semibold"
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
        )}
      </div>
    </main>
  );
}

