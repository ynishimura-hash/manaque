import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { EvolutionAlertModal } from "@/components/gamification/EvolutionAlertModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "マナクエ — 学んで、強くなれ。",
  description: "ゲーム感覚で資格を攻略する、新しい学習RPG体験。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "マナクエ",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased font-sans" suppressHydrationWarning={true}>
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
          <Toaster position="top-center" richColors />
          <EvolutionAlertModal />
        </AuthProvider>
      </body>
    </html>
  );
}
