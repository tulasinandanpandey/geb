import type { Metadata } from "next";

import {
  Cormorant_Garamond,
  Inter,
} from "next/font/google";

import "./globals.css";

import Providers from "@/components/providers/Providers";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});


const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: [
    "400",
    "500",
    "600",
    "700",
  ],
});


export const metadata: Metadata = {
  title:
    "GEB — Your Personal AI Real-Estate Agent",

  description:
    "Discover properties, understand investment opportunities, and connect with real-estate experts through GEB.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (

    <html lang="en">

      <body
        className={`${inter.variable} ${cormorant.variable} font-sans antialiased`}
      >

        <Providers>
          {children}
        </Providers>

      </body>

    </html>

  );

}
