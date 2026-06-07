import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PowerNap - 昼寝専用極上タイマー',
  description: '深い眠りに入るのを防ぎ、最適なリフレッシュ効果をもたらす昼寝専用のタイマーアプリ。',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <body>
        {children}
      </body>
    </html>
  );
}
