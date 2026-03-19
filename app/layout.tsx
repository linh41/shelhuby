import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shehuby — Storage Explorer for Shelby Protocol",
  description: "Explore and manage your blobs on the Shelby decentralized storage network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ background: 'var(--page-bg)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  );
}
