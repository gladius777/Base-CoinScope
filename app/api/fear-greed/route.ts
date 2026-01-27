import { NextResponse } from "next/server";

const ALTERNATIVE_FNG_URL = "https://api.alternative.me/fng/?limit=1";

// In-memory cache: shared across all requests
interface CacheEntry {
  data: {
    value: number;
    value_classification: string;
  };
  timestamp: number;
}

const fearGreedCache: CacheEntry = {
  data: {
    value: 0,
    value_classification: "Unknown",
  },
  timestamp: 0,
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET() {
  const now = Date.now();
  const cacheAge = now - fearGreedCache.timestamp;
  const isCacheValid = fearGreedCache.timestamp > 0 && cacheAge < CACHE_TTL_MS;

  // Return cached data if valid
  if (isCacheValid) {
    return NextResponse.json({
      ...fearGreedCache.data,
      fetchedAt: fearGreedCache.timestamp,
    });
  }

  // Cache expired or empty - fetch from Alternative.me
  try {
    const res = await fetch(ALTERNATIVE_FNG_URL, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      return NextResponse.json(
        { error: `Failed to fetch Fear & Greed Index: ${res.status} ${errorText}` },
        { status: 500 }
      );
    }

    const json = await res.json();
    const first = json?.data?.[0];

    if (!first) {
      return NextResponse.json(
        { error: "No Fear & Greed data" },
        { status: 502 }
      );
    }

    // Alternative.me returns value as string, convert to number
    const value = Math.min(
      100,
      Math.max(0, Number(first.value) ?? 0)
    );
    const value_classification =
      typeof first.value_classification === "string"
        ? first.value_classification
        : "Unknown";

    const result = { value, value_classification };

    // Update cache
    fearGreedCache.data = result;
    fearGreedCache.timestamp = now;

    return NextResponse.json({
      ...result,
      fetchedAt: now,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error while fetching Fear & Greed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
