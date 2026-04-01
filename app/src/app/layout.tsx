import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { DevPanelLoader } from "@/components/dev/DevPanelLoader";
import { ClerkProvider } from "@clerk/nextjs";

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
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased">
        <ClerkProvider>
          <AppShell>{children}</AppShell>
          <DevPanelLoader />
        </ClerkProvider>
      </body>
    </html>
  );
}
