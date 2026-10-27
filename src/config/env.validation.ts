/**
 * Validación de variables de entorno al arrancar.
 * Si falta alguna variable obligatoria la aplicación no inicia y muestra
 * exactamente cuál falta, en lugar de fallar más tarde con errores confusos.
 */
const REQUIRED_VARIABLES = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'API_KEY',
] as const;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_VARIABLES.filter(
    (key) => config[key] === undefined || String(config[key]).trim() === '',
  );

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
        'Copia .env.example a .env y completa los valores.',
    );
  }

  if (Number.isNaN(Number(config.DB_PORT))) {
    throw new Error('DB_PORT debe ser un número.');
  }

  return config;
}