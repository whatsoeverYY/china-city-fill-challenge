import type { Metadata } from "next";
import "./globals.css";
import { PlayerDataProvider } from "./PlayerDataProvider";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://whatsoeveryy.github.io/china-city-fill-challenge"
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "中国城市填充挑战",
    template: "%s｜中国城市填充挑战",
  },
  description: "覆盖 34 个省级行政区的中国城市地图拖拽挑战。",
  icons: {
    icon: `${siteUrl}/favicon.svg`,
    shortcut: `${siteUrl}/favicon.svg`,
  },
  openGraph: {
    title: "中国城市填充挑战",
    description: "从一省出发，拼出整幅中国城市地图。",
    url: siteUrl,
    images: [{ url: `${siteUrl}/og.png`, width: 1536, height: 1024 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "中国城市填充挑战",
    description: "从一省出发，拼出整幅中国城市地图。",
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body><PlayerDataProvider>{children}</PlayerDataProvider></body>
    </html>
  );
}
