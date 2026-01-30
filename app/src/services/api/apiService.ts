/**
 * API Service Class
 *
 * Generic HTTP client with type safety
 */

import { TIMEOUTS } from '../../config/env';
import { ApiResponse, PaginatedResponse } from '../../types/generic';
import { RequestConfig, ApiServiceConfig } from './apiTypes';

export class ApiService {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private onUnauthorized?: () => void;
  private getAuthToken?: () => Promise<string | null>;

  constructor(config: ApiServiceConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultHeaders = config.defaultHeaders || {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    this.timeout = config.timeout || TIMEOUTS.API_REQUEST;
    this.onUnauthorized = config.onUnauthorized;
    this.getAuthToken = config.getAuthToken;
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number>,
  ): string {
    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, String(value));
      });
    }

    return url;
  }

  private buildQueryString(query?: Record<string, unknown>): string {
    if (!query) return '';

    const params = Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      )
      .join('&');

    return params ? `?${params}` : '';
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      params,
      query,
    } = config;

    const url = this.buildUrl(endpoint, params) + this.buildQueryString(query);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const authHeaders: Record<string, string> = {};
      if (this.getAuthToken) {
        const token = await this.getAuthToken();
        if (token) {
          authHeaders.Authorization = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...authHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.code || `HTTP_${response.status}`,
            message:
              data.message || `Request failed with status ${response.status}`,
            details: data.details,
          },
        };
      }

      return {
        success: true,
        data: data.data ?? data,
        meta: data.meta,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: { code: 'TIMEOUT', message: 'Request timed out' },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error occurred',
        },
      };
    }
  }

  async get<T>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T, B = unknown>(
    endpoint: string,
    body?: B,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T, B = unknown>(
    endpoint: string,
    body?: B,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T, B = unknown>(
    endpoint: string,
    body?: B,
    config?: Omit<RequestConfig, 'method' | 'body'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T>(
    endpoint: string,
    config?: Omit<RequestConfig, 'method'>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async paginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    config?: Omit<RequestConfig, 'query'>,
  ): Promise<PaginatedResponse<T>> {
    const response = await this.get<T[]>(endpoint, {
      ...config,
      query: { page, limit, ...config?.query } as Record<string, unknown>,
    });

    return {
      ...response,
      meta: response.meta || {
        page,
        limit,
        total: response.data?.length || 0,
        hasMore: (response.data?.length || 0) === limit,
      },
    };
  }
}
