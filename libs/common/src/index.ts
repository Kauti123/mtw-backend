import { problem, ProblemDetailsFilter } from './lib/problem-details.filter';
import { CORRELATION_ID_HEADER, CorrelationIdInterceptor } from './lib/correlation-id.interceptor';
import {
  SkipApiResponseWrap,
  TransformResponseInterceptor,
} from './lib/transform-response.interceptor';
import {
  apiResponse,
  defaultSuccessMessage,
  isApiResponse,
  SKIP_API_RESPONSE_WRAP_KEY,
  type ApiResponse,
} from './lib/api-response';
import {
  CorporateId,
  CorrelationId,
  CurrentUser,
  IdempotencyKey,
  IS_PUBLIC_KEY,
  Public,
} from './lib/decorators';
import { setupSwagger, type SwaggerSetupOptions } from './lib/swagger';

export {
  problem,
  ProblemDetailsFilter,
  CORRELATION_ID_HEADER,
  CorrelationIdInterceptor,
  TransformResponseInterceptor,
  SkipApiResponseWrap,
  apiResponse,
  defaultSuccessMessage,
  isApiResponse,
  SKIP_API_RESPONSE_WRAP_KEY,
  CorporateId,
  CorrelationId,
  CurrentUser,
  IdempotencyKey,
  IS_PUBLIC_KEY,
  Public,
  setupSwagger,
};

export type { SwaggerSetupOptions, ApiResponse };
