import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Discord Scraper Viewer',
  description: 'View scraped Discord channel data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
