import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CheatHub - 现代化游戏作弊码管理平台",
  description: "基于 CheatSlips API 的现代化前端应用，轻松获取和管理您的游戏作弊码",
  keywords: ["游戏作弊码", "CheatSlips", "游戏修改", "Nintendo Switch"],
  authors: [{ name: "CheatHub Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "CheatHub - 现代化游戏作弊码管理平台",
    description: "基于 CheatSlips API 的现代化前端应用",
    type: "website",
    locale: "zh_CN",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
