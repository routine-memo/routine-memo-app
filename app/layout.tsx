import type { Metadata } from "next";
import { BottomNav } from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Routine Memo",
  description: "어떠한 한 가지에 관한 기록을 꾸준히 하는 앱",
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
      </head>
      <body className="font-sans antialiased pb-20">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
