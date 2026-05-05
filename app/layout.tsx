import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/app/components/I18nProvider';
import { Nav } from '@/app/components/Nav';
import { Footer } from '@/app/components/Footer';

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
        <I18nProvider>
          <Nav />
          <main className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
