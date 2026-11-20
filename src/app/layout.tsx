import type { Metadata, Viewport } from "next";
import "./globals.css";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MotionProvider from "@/components/MotionProvider";
import InteractiveLoader from "@/components/InteractiveLoader";
import { SITE_URL, site, NOINDEX, BASE_PATH } from "@/data/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Peak Side — Outdoor Hoodies, Tees & Crop Tops | Mountains meet everyday",
    template: "%s | Peak Side",
  },
  description: site.description,
  applicationName: "Peak Side",
  openGraph: {
    type: "website",
    siteName: "Peak Side",
    locale: "en_US",
    images: [{ url: `${SITE_URL}/images/tunnel-crew-1600.webp`, width: 1600, height: 1067, alt: "The Peak Side crew in hoodies, tees and crop tops" }],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: `${BASE_PATH}/favicon.svg` },
  alternates: { canonical: "/" },
  robots: NOINDEX ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#11110F",
  width: "device-width",
  initialScale: 1,
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Peak Side",
  url: SITE_URL,
  logo: `${SITE_URL}/images/mark-pks-960.webp`,
  slogan: site.tagline,
  email: site.email,
  sameAs: [site.instagram.url],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ ["--pks" as string]: `url(${BASE_PATH}/images/mark-pks-480.webp)` }}>
        <a href="#main" className="label sr-only z-[60] bg-ink px-4 py-3 text-bone focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <MotionProvider>
          <AnnouncementBar />
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </MotionProvider>
        <InteractiveLoader />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </body>
    </html>
  );
}
