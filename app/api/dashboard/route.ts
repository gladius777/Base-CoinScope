import { NextResponse } from "next/server";

// Combined endpoint that returns all dashboard data at once
// This reduces the number of requests from frontend

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
    
    // Fetch all data in parallel
    const [pricesRes, fngRes, globalMetricsRes] = await Promise.all([
      fetch(`${baseUrl}/api/prices`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/fear-greed`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/global-metrics`, { cache: "no-store" }),
    ]);

    const pricesData = pricesRes.ok ? await pricesRes.json() : { data: [], fetchedAt: null };
    const fngData = fngRes.ok ? await fngRes.json() : { value: null, value_classification: null, fetchedAt: null };
    const metricsData = globalMetricsRes.ok ? await globalMetricsRes.json() : { total_market_cap: 0, total_volume_24h: 0, fetchedAt: null };

    // Find the latest fetchedAt timestamp
    const timestamps = [
      pricesData.fetchedAt,
      fngData.fetchedAt,
      metricsData.fetchedAt,
    ].filter((t): t is number => typeof t === "number");

    return NextResponse.json({
      prices: pricesData.data || [],
      fearGreed: fngData.value !== null ? {
        value: fngData.value,
        value_classification: fngData.value_classification,
      } : null,
      globalMetrics: metricsData.total_market_cap > 0 ? {
        total_market_cap: metricsData.total_market_cap,
        total_volume_24h: metricsData.total_volume_24h,
      } : null,
      fetchedAt: timestamps.length > 0 ? Math.max(...timestamps) : null,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Server error while fetching dashboard data: ${errorMessage}` },
      { status: 500 }
    );
  }
}
