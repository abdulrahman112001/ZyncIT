/**
 * API Module Index
 *
 * Re-exports all API utilities
 */

// Types
export type { HttpMethod, RequestConfig, ApiServiceConfig } from './apiTypes';

// Error
export { ApiError } from './apiError';

// Service
export { ApiService } from './apiService';

// CRUD Factory
export { createCrudService } from './crudService';
export type { CrudServiceConfig } from './crudService';

// Default Instance
export { apiService, default } from './apiInstance';
