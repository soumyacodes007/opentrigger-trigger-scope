import type { Metadata, Viewport } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import SiteHeader from "@/components/SiteHeader";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trigger Scope",
    template: "%s · Trigger Scope",
  },
  description:
    "A read-only, public explorer of the OpenTrigger network: workers, live receipts and rule audits, read straight from Arkiv in your browser.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050805",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={vt323.variable}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" className="shell" tabIndex={-1}>
            {children}
          </main>
          <footer className="shell site-footer muted-small">
            Trigger Scope · read-only · OpenTrigger SDK (MIT) · Arkiv Tiramisu testnet, chain 7738577 ·{" "}
            <a href="https://github.com/soumyacodes007/arkiv-triggers" target="_blank" rel="noopener noreferrer">
              source
            </a>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
