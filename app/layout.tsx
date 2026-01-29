import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { MiniappReady } from "./components/MiniappReady";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_URL || "https://base-coin-scope.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "CoinScope",
  description: "Track crypto prices on Base with CoinMarketCap data.",
  metadataBase: new URL(appUrl),
  openGraph: {
    title: "CoinScope",
    description: "Track crypto prices on Base with CoinMarketCap data.",
    images: [{ url: `${appUrl}/coinscope-logo.png` }],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/coinscope-logo.png`,
      button: {
        title: "Open CoinScope",
        action: {
          type: "launch_miniapp",
          name: "CoinScope",
          url: appUrl,
          splashImageUrl: `${appUrl}/icon.png`,
          splashBackgroundColor: "#000000",
        },
      },
    }),
    "base:app_id": "6978a9b788e3bac59cf3db4d",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <MiniappReady />
        {children}
      </body>
    </html>
  );
}
