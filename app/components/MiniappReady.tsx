"use client";

import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";

/**
 * Calls sdk.actions.ready() as soon as the app mounts.
 * Required for Base Preview / Farcaster miniapp embed to show "Ready" and display the app.
 * Must run before any data fetching to avoid "Not Ready" timeout.
 */
export function MiniappReady() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await sdk.actions.ready({ disableNativeGestures: true });
        if (!cancelled && typeof window !== "undefined") {
          console.log("[CoinScope] sdk.actions.ready() completed");
        }
      } catch (e) {
        if (!cancelled && typeof window !== "undefined") {
          console.error("[CoinScope] sdk.actions.ready() failed:", e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
