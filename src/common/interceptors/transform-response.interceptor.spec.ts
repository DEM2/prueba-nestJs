import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { TransformResponseInterceptor } from './transform-response.interceptor';

describe('TransformResponseInterceptor', () => {
  it('envuelve la respuesta en el formato uniforme', async () => {
    const interceptor = new TransformResponseInterceptor<{ ok: boolean }>();
    const context = {
      switchToHttp: () => ({ getResponse: () => ({ statusCode: 201 }) }),
    } as unknown as ExecutionContext;
    const next: CallHandler<{ ok: boolean }> = { handle: () => of({ ok: true }) };

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual({
      success: true,
      statusCode: 201,
      data: { ok: true },
      timestamp: expect.any(String),
    });
  });
});