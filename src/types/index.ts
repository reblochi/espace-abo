// Export de tous les types

export * from './subscription';
export * from './process';
export * from './document';
export * from './invoice';
export * from './user';

// Types utilitaires communs
export interface ApiError {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// City pour l'autocomplete
export interface City {
  id: number;
  name: string;
  postalCode?: string;
  departmentCode?: string;
}
