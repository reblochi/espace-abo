-- Ajout du type SIGNALEMENT_MAIRIE dans l'enum ProcessType
ALTER TYPE "espace_abo"."ProcessType" ADD VALUE IF NOT EXISTS 'SIGNALEMENT_MAIRIE';
