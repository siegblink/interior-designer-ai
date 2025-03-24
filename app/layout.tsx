import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import { Sidebar } from "./sidebar";
import { Metadata } from "next";

// Load Inter font with Latin subset
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
  themeColor: "#111827",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        className={`${inter.className} min-h-screen overflow-x-hidden bg-gray-900 text-gray-100 antialiased`}
      >
        {/* Animated background elements */}
        <div className="fixed inset-0 -z-10">
          {/* Base radial gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.15),transparent_80%)]"></div>

          {/* Grid pattern overlay */}
          <div className="bg-grid-pattern absolute inset-0 opacity-[0.03]"></div>

          {/* Moving spotlight effects */}
          <div className="spotlight-blue absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-30"></div>
          <div className="spotlight-indigo absolute bottom-0 right-1/4 h-[600px] w-[600px] opacity-30"></div>
          <div className="spotlight-purple absolute bottom-1/4 left-1/4 h-[500px] w-[500px] opacity-20"></div>

          {/* Animated stars/particles (using pseudo-elements and CSS) */}
          <div className="stars-container"></div>
        </div>

        <Sidebar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
