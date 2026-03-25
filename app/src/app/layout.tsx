import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import "./globals.css";

// Using Space Grotesk (display) and DM Sans (body) as high-quality free alternatives
// Replace with Clash Display + Neue Montreal when commercial licenses are added
// Drop the .woff2 files into /public/fonts/ and switch to localFont

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-clash-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-neue-montreal",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Dhun — Make a song for someone you love",
  description:
    "Create personalized AI-generated songs and dedicate them to the people you love. Birthday, anniversary, love, apology — say it with a Dhun.",
  openGraph: {
    title: "Dhun — Make a song for someone you love",
    description:
      "Create personalized AI-generated songs and dedicate them to the people you love.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} h-full`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
