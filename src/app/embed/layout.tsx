// Layout minimal pour les pages embarquées (iframe/widget)
// Pas de header/footer, fond blanc, pas de navigation

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Démarche en ligne',
  robots: 'noindex, nofollow',
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <style>{`footer { display: none !important; }`}</style>
    </>
  );
}
