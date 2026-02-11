import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import "./globals.css";
import { NavWrapper } from "@/components/nav-wrapper";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Give — Donations for Churches & Nonprofits",
  description: "Give and manage donations for your community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={barlow.variable}>
      <body className={`${barlow.className} min-h-screen bg-white text-slate-900 antialiased`}>
        <div id="root-app" className="min-h-screen">
          <NavWrapper />
          {children}
        </div>
      </body>
    </html>
  );
}
