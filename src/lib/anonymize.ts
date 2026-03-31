// Logique d'anonymisation RGPD
//
// Anonymise les donnees de traitement des demarches (documents, formulaires)
// tout en conservant les donnees d'identification du client :
// - Nom, prenom, email, adresse (obligation legale compta 10 ans, art. L123-22 Code de commerce)
// - Factures et montants
// - References, dates des abonnements et echeances

import { prisma } from '@/lib/db';

/**
 * Anonymise les donnees de traitement d'un client :
 * - Vide le contenu des formulaires de demarches (Process.data)
 * - Soft-delete les fichiers uploades (pieces d'identite, justificatifs...)
 *
 * Conserve : nom, prenom, email, adresse, factures, abonnement, montants.
 */
export async function anonymizeUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      processes: { select: { id: true, reference: true } },
    },
  });

  if (!user) throw new Error('Utilisateur non trouve');

  const now = new Date();

  // 1. Anonymiser les donnees de traitement dans les demarches (JSON data)
  // On garde la structure minimale pour savoir que c'est anonymise
  for (const process of user.processes) {
    await prisma.process.update({
      where: { id: process.id },
      data: {
        data: {
          _anonymise: true,
          _date_anonymisation: now.toISOString(),
          _reference: process.reference,
        },
      },
    });
  }

  // 2. Soft-delete les fichiers uploades (CNI, justificatifs, etc.)
  const deletedFiles = await prisma.processFile.updateMany({
    where: { userId, deleted: false },
    data: { deleted: true, deletedAt: now },
  });

  return {
    processesAnonymized: user.processes.length,
    filesDeleted: deletedFiles.count,
  };
}
