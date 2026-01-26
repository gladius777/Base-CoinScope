import { NextResponse } from "next/server";

const ALTERNATIVE_FNG_URL = "https://api.alternative.me/fng/?limit=1";

export async function GET() {
  try {
    const res = await fetch(ALTERNATIVE_FNG_URL, {
      headers: {
        Accept: "application/json",
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

    // Alternative.me returns value as string, convert to number
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
