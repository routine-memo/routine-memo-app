import type { Metadata } from "next";
import { BottomNavWrapper } from "@/components/Navigation";
import { ClientProviders } from "@/components/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "꾸모리",
  description: "어떠한 한 가지에 관한 기록을 꾸준히 하는 앱",
  manifest: "/manifest.json",
  themeColor: "#f59e0b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "꾸모리",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Pretendard:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased pb-20">
        <ClientProviders>
          {children}
        </ClientProviders>
        <BottomNavWrapper />
      </body>
    </html>
  );
}
