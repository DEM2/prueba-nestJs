    import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url: '/api/test' }),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => jest.clearAllMocks());

  it('respeta el código de una HttpException e incluye ruta y fecha', () => {
    filter.catch(new NotFoundException('No existe'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 404,
        message: 'No existe',
        path: '/api/test',
        timestamp: expect.any(String),
      }),
    );
  });

  it('convierte un error de unicidad de PostgreSQL en 409', () => {
    const error = new QueryFailedError('INSERT ...', [], { code: '23505' } as never);
    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(409);
  });

  it('un error desconocido responde 500 sin exponer detalles', () => {
    filter.catch(new Error('detalle interno'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error interno del servidor' }),
    );
  });
});