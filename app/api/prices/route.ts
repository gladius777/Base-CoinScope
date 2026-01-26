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
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=100&convert=USD",
      {
        headers: { "X-CMC_PRO_API_KEY": apiKey },
        next: { revalidate: 30 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from CMC" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data.data || []);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

