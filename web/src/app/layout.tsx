import "./globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { ConvexClientProvider } from "@/providers/convex-client-proivder";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";

export const metadata: Metadata = {
  title: "MFD Alerts",
  description: "MFD Alerts",
  icons: [{ rel: "icon", type: "image/png", url: "/favicon.png" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} !smooth-scroll dark bg-background h-screen`}
    >
      <body className="h-full w-full">
        <TRPCReactProvider>
          <ConvexClientProvider>
            <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
          </ConvexClientProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
