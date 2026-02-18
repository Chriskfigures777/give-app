import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { MeProvider } from "@/lib/use-me";
import { PricingModalProvider } from "@/lib/use-pricing-modal";
import { NavWrapper } from "@/components/nav-wrapper";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-barlow",
  display: "swap",
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
    <html lang="en" className={barlow.variable} suppressHydrationWarning>
      <body className={`${barlow.className} min-h-screen bg-white text-slate-900 antialiased`}>
        <div id="root-app" className="min-h-screen">
          <MeProvider>
            <PricingModalProvider>
              <NavWrapper />
              {children}
            </PricingModalProvider>
          </MeProvider>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
