export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
}

export const SKIP_API_RESPONSE_WRAP_KEY = 'skipApiResponseWrap';

export function isApiResponse(value: unknown): value is ApiResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record['statusCode'] === 'number' &&
    typeof record['message'] === 'string' &&
    'data' in record
  );
}

export function apiResponse<T>(statusCode: number, message: string, data: T): ApiResponse<T> {
  return { statusCode, message, data };
}

export function defaultSuccessMessage(statusCode: number): string {
  switch (statusCode) {
    case 201:
      return 'Created successfully';
    case 204:
      return 'No content';
    default:
      return 'Success';
  }
}
