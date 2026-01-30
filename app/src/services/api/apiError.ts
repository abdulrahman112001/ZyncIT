/**
 * API Error Class
 *
 * Custom error class for API errors
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: Response, data?: any): ApiError {
    return new ApiError(
      data?.code || `HTTP_${response.status}`,
      data?.message || response.statusText,
      response.status,
      data?.details,
    );
  }

  static timeout(): ApiError {
    return new ApiError('TIMEOUT', 'Request timed out');
  }

  static network(message: string): ApiError {
    return new ApiError('NETWORK_ERROR', message);
  }
}
