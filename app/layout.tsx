import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

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
    "AI interior design",
    "interior design AI tool",
    "room makeover AI",
    "upload photo room redesign",
    "AI home decor",
    "free interior design AI",
    "room style generator",
    "before after room design",
    "AI room decorator",
    "home design AI free",
    "Scandinavian interior design AI",
    "modern interior design generator",
    "minimalist home design tool",
    "room photo redesign app",
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
        url: "https://interior-designer-ai.vercel.app/og-image.png",
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
    images: ["https://interior-designer-ai.vercel.app/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

type RootLayoutProps = {
  children: React.ReactNode;
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Interior Designer AI",
  description:
    "Transform your space with AI-powered interior design in seconds. Upload a photo of any room and instantly see it reimagined in dozens of design styles.",
  url: "https://interior-designer-ai.vercel.app/",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  creator: {
    "@type": "Organization",
    name: "Interior Designer AI",
  },
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
