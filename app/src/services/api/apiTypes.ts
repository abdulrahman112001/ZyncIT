/**
 * API Types
 *
 * Types for API service
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  params?: Record<string, string | number>;
  query?: Record<string, unknown>;
}

export interface ApiServiceConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeout?: number;
  onUnauthorized?: () => void;
  getAuthToken?: () => Promise<string | null>;
}

export interface CrudServiceConfig {
  api: any; // ApiService type
  basePath: string;
}
