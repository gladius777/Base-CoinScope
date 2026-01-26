import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CMC_API_KEY not set" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      "https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest?convert=USD",
      {
        headers: { "X-CMC_PRO_API_KEY": apiKey },
        next: { revalidate: 21600 }, // 6 hours = 21600 seconds
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from CMC" },
        { status: res.status }
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

    return NextResponse.json({
      total_market_cap: quote.total_market_cap ?? 0,
      total_volume_24h: quote.total_volume_24h ?? 0,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
