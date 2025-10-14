import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { MerchantProvider } from "@/contexts/MerchantContext";
import StripeProvider from "@/components/StripeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TapOrder - Restaurant Ordering Made Simple",
  description: "Scan QR codes to order from restaurants instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <CartProvider>
            <MerchantProvider>
              <StripeProvider>
                {children}
              </StripeProvider>
            </MerchantProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
