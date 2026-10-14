import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { TransformResponseInterceptor } from './transform-response.interceptor';
import { SKIP_API_RESPONSE_WRAP_KEY } from './api-response';

describe('TransformResponseInterceptor', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const reply = { statusCode: 200 };
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getResponse: () => reply,
    }),
  } as unknown as ExecutionContext;

  it('wraps controller results in the common envelope', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const interceptor = new TransformResponseInterceptor(reflector);
    const next: CallHandler = { handle: () => of({ id: '1' }) };

    const result = await lastValueFrom(interceptor.intercept(context, next));
    expect(result).toEqual({
      statusCode: 200,
      message: 'Success',
      data: { id: '1' },
    });
  });

  it('does not double-wrap an existing envelope', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const interceptor = new TransformResponseInterceptor(reflector);
    const envelope = {
      statusCode: 201,
      message: 'Created successfully',
      data: { id: '2' },
    };
    const next: CallHandler = { handle: () => of(envelope) };

    const result = await lastValueFrom(interceptor.intercept(context, next));
    expect(result).toEqual(envelope);
  });

  it('skips wrapping when SkipApiResponseWrap is set', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key) =>
      key === SKIP_API_RESPONSE_WRAP_KEY ? true : false,
    );
    const interceptor = new TransformResponseInterceptor(reflector);
    const next: CallHandler = { handle: () => of('raw-metrics') };

    const result = await lastValueFrom(interceptor.intercept(context, next));
    expect(result).toBe('raw-metrics');
  });
});
