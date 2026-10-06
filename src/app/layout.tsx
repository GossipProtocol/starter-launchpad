import { SITE_URL } from "@/lib/network";
import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/Header";
import { Shell } from "@/components/Shell";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "launch lab · pick an emoji. pick a stock. launch.",
  description: "A Doppler multicurve launcher on Robinhood Chain. Claim a 1 to 3 emoji combo, pair it to a tokenized stock, launch with one transaction.",
  metadataBase: new URL(SITE_URL),
  openGraph: { title: "launch lab", description: "pick an emoji. pick a stock. launch." },
  applicationName: "launch lab",
  // Home-screen install on iOS: standalone window, no Safari chrome. The manifest (manifest.ts) is linked automatically.
  appleWebApp: { capable: true, title: "launch lab", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};
// viewportFit cover lets the page run under the notch and home indicator; Shell pads with env(safe-area-inset-*).
export const viewport: Viewport = { themeColor: "#DCEEFB", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <Providers>
          <Shell>
            <Header />
            {children}
          </Shell>
        </Providers>
      </body>
    </html>
  );
}
