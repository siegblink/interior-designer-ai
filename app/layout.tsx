import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Interior Designer AI",
  description:
    "Transform your space with AI-powered interior design in seconds.",
  keywords: [
    "interior design",
    "AI",
    "home design",
    "room redesign",
    "artificial intelligence",
  ],
  robots: "index, follow",
  openGraph: {
    title: "Interior Designer AI",
    description:
      "Transform your space with AI-powered interior design in seconds.",
    url: "https://interior-designer-ai.vercel.app/",
    siteName: "Interior Designer AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://interior-designer-ai.vercel.app/app-screenshot.png",
        width: 1200,
        height: 630,
        alt: "Interior Designer AI - Transform your space instantly",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interior Designer AI",
    description: "Transform your space with AI-powered interior design",
    images: ["https://interior-designer-ai.vercel.app/app-screenshot.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
