// Helpers authentification admin

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Verifie que l'utilisateur connecte est admin.
 * Re-verifie le role en BDD (le JWT peut etre stale jusqu'a 30 jours).
 * Retourne la session si OK, null sinon.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  // Re-check en BDD pour eviter qu'un admin demote garde l'acces via JWT
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return session;
}

/**
 * Enregistre une action admin dans le journal d'audit.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}
