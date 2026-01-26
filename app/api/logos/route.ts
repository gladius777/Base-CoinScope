import { NextResponse } from "next/server";

const CMC_INFO_URL = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/info";

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

  try {
    const res = await fetch(`${CMC_INFO_URL}?id=${ids}`, {
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": apiKey,
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch logos from CMC" },
        { status: res.status }
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

    return NextResponse.json(logoMap);
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
