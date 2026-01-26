import { NextResponse } from "next/server";

const CMC_FNG_URL =
  "https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?limit=1";

export async function GET() {
  const apiKey = process.env.CMC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CMC_API_KEY not set" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(CMC_FNG_URL, {
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": apiKey,
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Fear & Greed Index" },
        { status: res.status }
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

    const value = Math.min(
      100,
      Math.max(0, Number(first.value) ?? 0)
    );
    const value_classification =
      typeof first.value_classification === "string"
        ? first.value_classification
        : "Unknown";

    return NextResponse.json({ value, value_classification });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
