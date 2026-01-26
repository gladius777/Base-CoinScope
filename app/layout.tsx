import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

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
    images: [{ url: "/globe.svg" }],
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/globe.svg`,
      button: {
        title: "Open CoinScope",
        action: {
          type: "launch_miniapp",
          name: "CoinScope",
          url: appUrl,
          splashImageUrl: `${appUrl}/next.svg`,
          splashBackgroundColor: "#000000",
        },
      },
    }),
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
        {children}
      </body>
    </html>
  );
}
