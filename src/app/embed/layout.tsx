// Layout minimal pour les pages embarquees (iframe/widget)
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
  return <>{children}</>;
}
