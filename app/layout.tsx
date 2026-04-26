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
            <a href="/transactions/new" className="text-gray-400 hover:text-white transition">Add Transaction</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-800 mt-12 py-4">
          <p className="text-center text-xs text-gray-600">
            Your data stays on your device — nothing is uploaded except during Gmail sync and live price lookups.
          </p>
        </footer>
      </body>
    </html>
  );
}
