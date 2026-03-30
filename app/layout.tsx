import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portfolio MVP',
  description: 'Personal portfolio tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-6">
            <a href="/" className="text-lg font-bold text-white">Portfolio MVP</a>
            <a href="/sync" className="text-gray-400 hover:text-white transition">Sync</a>
            <a href="/holdings" className="text-gray-400 hover:text-white transition">Holdings</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
