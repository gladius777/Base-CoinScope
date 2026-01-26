import { NextResponse } from "next/server";

type MiniAppProperties = Record<string, string | string[] | undefined>;

function withValidProperties(properties: MiniAppProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    )
  );
}

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

  return NextResponse.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER ?? "",
      payload: process.env.FARCASTER_PAYLOAD ?? "",
      signature: process.env.FARCASTER_SIGNATURE ?? "",
    },
    miniapp: withValidProperties({
      version: "1",
      name: "Base Price Tracker",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/globe.svg`,
      splashImageUrl: `${appUrl}/next.svg`,
      splashBackgroundColor: "#000000",
      subtitle: "Track crypto prices on Base",
      description: "Live CoinMarketCap prices for BTC, ETH, SOL, and more.",
      screenshotUrls: [`${appUrl}/globe.svg`],
      primaryCategory: "finance",
      tags: ["prices", "crypto", "base"],
      heroImageUrl: `${appUrl}/globe.svg`,
      tagline: "Watch prices in real time",
      ogTitle: "Base Price Tracker",
      ogDescription: "Live CoinMarketCap prices with Base-friendly UI.",
      ogImageUrl: `${appUrl}/globe.svg`,
    }),
  });
}
