// Layout principal de l'application

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FranceGuichet - Service d\'Aide aux Formalites',
  description: 'Simplifiez vos demarches administratives avec FranceGuichet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <div className="flex-1" id="main-content">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
