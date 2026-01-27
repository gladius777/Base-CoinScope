import { NextResponse } from "next/server";

const CMC_INFO_URL = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/info";

// In-memory cache: shared across all requests
interface CacheEntry {
  data: Record<string, string>;
  timestamp: number;
}

const logoCache: CacheEntry = {
  data: {},
  timestamp: 0,
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET(req: Request) {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CMC_API_KEY not set" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  if (!ids || !/^[\d,]+$/.test(ids)) {
    return NextResponse.json(
      { error: "Missing or invalid ids query (comma-separated numbers)" },
      { status: 400 }
    );
  }

  const now = Date.now();
  const cacheAge = now - logoCache.timestamp;
  const isCacheValid = logoCache.timestamp > 0 && cacheAge < CACHE_TTL_MS;

  // Return cached data if valid
  if (isCacheValid) {
    const requestedIds = ids.split(",");
    const cachedResult: Record<string, string> = {};
    
    for (const id of requestedIds) {
      if (logoCache.data[id]) {
        cachedResult[id] = logoCache.data[id];
      }
    }
    console.log(`[SERVER] [${new Date().toISOString()}] Returning cached logos (age: ${Math.round(cacheAge / 1000)}s, TTL: ${CACHE_TTL_MS / 1000}s)`);
    return NextResponse.json({
      ...cachedResult,
      fetchedAt: logoCache.timestamp,
    });
  }

  // Cache expired or empty - fetch from CoinMarketCap
  console.log(`[SERVER] [${new Date().toISOString()}] Fetching logos from CoinMarketCap for IDs: ${ids} (cache expired or empty)`);
  try {
    const res = await fetch(`${CMC_INFO_URL}?id=${ids}`, {
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Failed to fetch logos from CoinMarketCap: ${res.status} ${errorText}` },
        { status: 500 }
      );
    }

    const json = (await res.json()) as {
      data?: Record<string, { logo?: string }>;
    };
    const data = json?.data ?? {};
    const logoMap: Record<string, string> = {};

    for (const [id, entry] of Object.entries(data)) {
      const logo = entry?.logo;
      if (typeof logo === "string" && logo.length > 0) {
        logoMap[id] = logo;
      }
    }

    // Update cache with all fetched logos
    logoCache.data = { ...logoCache.data, ...logoMap };
    logoCache.timestamp = now;
    console.log(`[SERVER] [${new Date().toISOString()}] Logos fetched successfully: ${Object.keys(logoMap).length} logos, cached until ${new Date(now + CACHE_TTL_MS).toISOString()}`);

    // Return only requested IDs
    const requestedIds = ids.split(",");
    const result: Record<string, string> = {};
    for (const id of requestedIds) {
      if (logoMap[id]) {
        result[id] = logoMap[id];
      }
    }

    return NextResponse.json({
      ...result,
      fetchedAt: now,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error while fetching logos: ${errorMessage}` },
      { status: 500 }
    );
  }
}
