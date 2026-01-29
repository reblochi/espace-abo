// Export de tous les schemas Zod

export * from './subscription';
export * from './process';
export * from './auth';

// Schemas de pagination communs
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type PaginationSchema = z.infer<typeof paginationSchema>;
