import { NextResponse } from "next/server";

// In-memory cache: shared across all requests
interface CacheEntry {
  data: any[];
  timestamp: number;
}

const pricesCache: CacheEntry = {
  data: [],
  timestamp: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CMC_API_KEY not set" },
      { status: 500 }
    );
  }

  const now = Date.now();
  const cacheAge = now - pricesCache.timestamp;
  const isCacheValid = pricesCache.timestamp > 0 && cacheAge < CACHE_TTL_MS;

  // Return cached data if valid
  if (isCacheValid) {
    console.log(`[SERVER] [${new Date().toISOString()}] Returning cached prices (age: ${Math.round(cacheAge / 1000)}s, TTL: ${CACHE_TTL_MS / 1000}s)`);
    return NextResponse.json({
      data: pricesCache.data,
      fetchedAt: pricesCache.timestamp,
    });
  }

  // Cache expired or empty - fetch from CoinMarketCap
  console.log(`[SERVER] [${new Date().toISOString()}] Fetching prices from CoinMarketCap (cache expired or empty)`);
  try {
    const res = await fetch(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=100&convert=USD",
      {
        headers: { "X-CMC_PRO_API_KEY": apiKey },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Failed to fetch prices from CoinMarketCap: ${res.status} ${errorText}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const coinList = data.data || [];

    // Update cache
    pricesCache.data = coinList;
    pricesCache.timestamp = now;
    console.log(`[SERVER] [${new Date().toISOString()}] Prices fetched successfully: ${coinList.length} coins, cached until ${new Date(now + CACHE_TTL_MS).toISOString()}`);

    return NextResponse.json({
      data: coinList,
      fetchedAt: now,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error while fetching prices: ${errorMessage}` },
      { status: 500 }
    );
  }
}

