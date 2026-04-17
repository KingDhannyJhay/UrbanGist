import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://urbangist.com.ng';
const SITE_NAME = 'UrbanGist';
const SITE_DESC =
  'UrbanGist — Nigeria\'s #1 music discovery platform. Stream, share and boost Afrobeats, Amapiano, Afrorap & Gospel. Upload your tracks and grow your fanbase today.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Discover Afrobeats, Amapiano & Nigerian Music`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [
    'Afrobeats music',
    'Nigerian music platform',
    'Amapiano',
    'Afrorap',
    'music discovery Nigeria',
    'upload music Nigeria',
    'music promotion Nigeria',
    'UrbanGist',
  ],
  authors: [{ name: 'UrbanGist Media', url: SITE_URL }],
  creator: 'UrbanGist Media',
  publisher: 'UrbanGist Media',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Discover Afrobeats, Amapiano & Nigerian Music`,
    description: SITE_DESC,
    images: [
      {
        url: `${SITE_URL}/images/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'UrbanGist Music Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@UrbanGist',
    creator: '@UrbanGist',
    title: `${SITE_NAME} — Discover Afrobeats & Nigerian Music`,
    description: SITE_DESC,
    images: [`${SITE_URL}/images/og-default.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0B0B',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Fonts — Clash Display + Satoshi via CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'UrbanGist',
              url: SITE_URL,
              logo: `${SITE_URL}/images/logo.png`,
              sameAs: [
                'https://twitter.com/UrbanGist',
                'https://instagram.com/UrbanGist',
              ],
            }),
          }}
        />
      </head>
      <body
        className="bg-bg-primary text-text-primary antialiased"
        style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          '--font-display': "'Syne', system-ui, sans-serif",
          '--font-body': "'DM Sans', system-ui, sans-serif",
          '--font-mono': "'JetBrains Mono', monospace",
        } as React.CSSProperties}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1C1C1C',
              color: '#F8F8F8',
              border: '1px solid #2A2A2A',
              borderRadius: '12px',
              fontFamily: "'DM Sans', sans-serif",
            },
            success: { iconTheme: { primary: '#22C55E', secondary: '#0B0B0B' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#0B0B0B' } },
          }}
        />
      </body>
    </html>
  );
}
