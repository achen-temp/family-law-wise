import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { AppTheme } from "@/components/app-theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Family Law Wise",
    template: "%s · Family Law Wise",
  },
  description: "Financial disclosure files for family law firms.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      {/* Grammarly and similar extensions can add body attributes before hydration. */}
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <AppTheme><StoreProvider>{children}</StoreProvider></AppTheme>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
