// Helpers authentification admin

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Verifie le role en BDD (le JWT peut etre stale jusqu'a 30 jours).
 * Retourne la session enrichie du role DB, ou null si non autorise.
 */
async function checkRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  // Mettre a jour le role dans la session pour le caller
  session.user.role = user.role;
  return session;
}

/**
 * Acces admin uniquement.
 */
export async function requireAdmin() {
  return checkRole(['ADMIN']);
}

/**
 * Acces admin ou agent.
 */
export async function requireAdminOrAgent() {
  return checkRole(['ADMIN', 'AGENT']);
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
