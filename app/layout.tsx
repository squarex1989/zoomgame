import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoom for Fun - 多人在线聚会游戏",
  description: "与朋友在线玩多人五子棋、鹅鸭杀等聚会游戏",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
