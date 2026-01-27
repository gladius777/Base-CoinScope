import { NextResponse } from "next/server";

// In-memory cache: shared across all requests
interface CacheEntry {
  data: {
    total_market_cap: number;
    total_volume_24h: number;
  };
  timestamp: number;
}

const globalMetricsCache: CacheEntry = {
  data: {
    total_market_cap: 0,
    total_volume_24h: 0,
  },
  timestamp: 0,
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export async function GET() {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CMC_API_KEY not set" },
      { status: 500 }
    );
  }

  const now = Date.now();
  const cacheAge = now - globalMetricsCache.timestamp;
  const isCacheValid = globalMetricsCache.timestamp > 0 && cacheAge < CACHE_TTL_MS;

  // Return cached data if valid
  if (isCacheValid) {
    return NextResponse.json({
      ...globalMetricsCache.data,
      fetchedAt: globalMetricsCache.timestamp,
    });
  }

  // Cache expired or empty - fetch from CoinMarketCap
  try {
    const res = await fetch(
      "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest?convert=USD",
      {
        headers: { "X-CMC_PRO_API_KEY": apiKey },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Failed to fetch global metrics from CoinMarketCap: ${res.status} ${errorText}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const quote = data?.data?.quote?.USD;

    if (!quote) {
      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 502 }
      );
    }

    const result = {
      total_market_cap: quote.total_market_cap ?? 0,
      total_volume_24h: quote.total_volume_24h ?? 0,
    };

    // Update cache
    globalMetricsCache.data = result;
    globalMetricsCache.timestamp = now;

    return NextResponse.json({
      ...result,
      fetchedAt: now,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error while fetching global metrics: ${errorMessage}` },
      { status: 500 }
    );
  }
}
