import type { Metadata, Viewport } from "next";
import { Geist, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-geist" });
const zen = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-jp",
  preload: false,
});

export const metadata: Metadata = {
  title: "先輩割り勘 — 傾斜つきの割り勘をLINEの文面に",
  description: "飲み会の割り勘を、先輩・後輩の傾斜つきで1分で決めて、そのままLINEに貼れる文面にします。",
};

export const viewport: Viewport = {
  themeColor: "#141414",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${geist.variable} ${zen.variable}`}>
      <body>{children}</body>
    </html>
  );
}
