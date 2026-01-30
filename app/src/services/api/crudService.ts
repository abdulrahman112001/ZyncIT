/**
 * CRUD Service Factory
 *
 * Creates type-safe CRUD services for any entity
 */

import { ApiResponse, PaginatedResponse } from '../../types/generic';
import { ApiService } from './apiService';

export interface CrudServiceConfig {
  api: ApiService;
  basePath: string;
}

export function createCrudService<
  T extends { id: string },
  CreateInput = Omit<T, 'id'>,
  UpdateInput = Partial<T>,
>(config: CrudServiceConfig) {
  const { api, basePath } = config;

  return {
    async getAll(query?: Record<string, unknown>): Promise<ApiResponse<T[]>> {
      return api.get<T[]>(basePath, { query });
    },

    async getPaginated(
      page?: number,
      limit?: number,
    ): Promise<PaginatedResponse<T>> {
      return api.paginated<T>(basePath, page, limit);
    },

    async getById(id: string): Promise<ApiResponse<T>> {
      return api.get<T>(`${basePath}/:id`, { params: { id } });
    },

    async create(data: CreateInput): Promise<ApiResponse<T>> {
      return api.post<T, CreateInput>(basePath, data);
    },

    async update(id: string, data: UpdateInput): Promise<ApiResponse<T>> {
      return api.patch<T, UpdateInput>(`${basePath}/:id`, data, {
        params: { id },
      });
    },

    async replace(id: string, data: CreateInput): Promise<ApiResponse<T>> {
      return api.put<T, CreateInput>(`${basePath}/:id`, data, {
        params: { id },
      });
    },

    async delete(id: string): Promise<ApiResponse<void>> {
      return api.delete<void>(`${basePath}/:id`, { params: { id } });
    },

    async bulkDelete(ids: string[]): Promise<ApiResponse<void>> {
      return api.post<void>(`${basePath}/bulk-delete`, { ids });
    },
  };
}
