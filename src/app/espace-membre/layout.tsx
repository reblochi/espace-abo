// Layout Espace Membre avec authentification

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MemberLayout } from '@/components/layout/MemberLayout';

interface Props {
  children: React.ReactNode;
}

export default async function EspaceMembreLayout({ children }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <MemberLayout>{children}</MemberLayout>;
}
