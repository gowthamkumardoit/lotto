import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import PlatformConfigBootstrap from "@/components/common/PlatformConfigBootstrap";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Kuber Lottery",
    template: "%s | Kuber Lottery",
  },
  description:
    "Play secure online lottery games including 2D, 3D, 4D draws with real-time results and instant payouts on Kuber Lottery.",
  keywords: [
    "online lottery",
    "2D lottery",
    "3D lottery",
    "4D lottery",
    "kuber lottery",
    "india lottery",
    "daily draw",
  ],
  authors: [{ name: "Kuber Lottery Team" }],
  creator: "Kuber Lottery",
  metadataBase: new URL("https:/kuberlotterys.com"),

  openGraph: {
    title: "Kuber Lottery - Play & Win Daily",
    description:
      "Secure online lottery platform with instant settlement and daily winning draws.",
    url: "https:/kuberlotterys.com",
    siteName: "Kuber Lottery",
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Kuber Lottery - Play & Win Daily",
    description:
      "Play 2D, 3D & 4D lottery games securely with real-time results.",
    images: ["/favicon-128x128.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-32x32.png",
    apple: "/favicon-128x128.png",
  },

  manifest: "/site.webmanifest",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <PlatformConfigBootstrap />
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
