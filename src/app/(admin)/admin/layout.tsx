// Layout Admin avec authentification

import { redirect } from 'next/navigation';
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

  if (session.user.role !== 'ADMIN') {
    redirect('/espace-membre');
  }

  return <AdminLayout>{children}</AdminLayout>;
}
