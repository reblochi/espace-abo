// Layout Admin avec authentification

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Props {
  children: React.ReactNode;
}

export default async function AdminRootLayout({ children }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Re-check role en BDD
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !['ADMIN', 'AGENT'].includes(user.role)) {
    redirect('/espace-membre');
  }

  return <AdminLayout role={user.role}>{children}</AdminLayout>;
}
