import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AdVerse - 参加型広告プラットフォーム',
  description: '世界中のユーザーが1マスずつ埋めていく、参加型の広告宇宙。1000×1000マスの巨大グリッドで、あなたの広告を配置しよう。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
