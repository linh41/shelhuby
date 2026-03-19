import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shehuby — Storage Explorer for Shelby Protocol",
  description: "Explore and manage your blobs on the Shelby decentralized storage network. Visualize wallet storage activity, track blob usage, and dive deep into on-chain data.",
  openGraph: {
    title: "Shehuby — Storage Explorer for Shelby Protocol",
    description: "Visualize wallet storage activity, track blob usage across the Shelby Protocol network, and dive deep into on-chain data.",
    type: "website",
    siteName: "Shehuby",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shehuby — Storage Explorer for Shelby Protocol",
    description: "Visualize wallet storage activity, track blob usage across the Shelby Protocol network, and dive deep into on-chain data.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
        {/* Skip to main content for keyboard/screen reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
