const REQUIRED_PRODUCTION_KEYS = [
  'DATABASE_URL',
  'TEACHER_COOKIE_SECRET',
  'STUDENT_COOKIE_SECRET',
  'ATTENDANCE_AUTH_USER',
  'ATTENDANCE_AUTH_PASS',
  'APP_ORIGIN',
];

export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export function getServerEnv(environment = process.env) {
  const nodeEnv = environment.NODE_ENV || 'development';
  const required = nodeEnv === 'production'
    ? REQUIRED_PRODUCTION_KEYS
    : REQUIRED_PRODUCTION_KEYS.filter((key) => key !== 'APP_ORIGIN');
  const missing = required.filter((key) => !environment[key] || !String(environment[key]).trim());
  if (missing.length) throw new ConfigurationError(`Missing required server configuration: ${missing.join(', ')}`);

  if (environment.APP_ORIGIN) {
    let origin;
    try { origin = new URL(environment.APP_ORIGIN).origin; } catch { throw new ConfigurationError('APP_ORIGIN must be an absolute origin'); }
    if (origin !== environment.APP_ORIGIN.replace(/\/$/, '')) throw new ConfigurationError('APP_ORIGIN must not include a path');
  }

  return Object.freeze({
    nodeEnv,
    databaseUrl: environment.DATABASE_URL,
    teacherCookieSecret: environment.TEACHER_COOKIE_SECRET,
    studentCookieSecret: environment.STUDENT_COOKIE_SECRET,
    attendanceAuthUser: environment.ATTENDANCE_AUTH_USER,
    attendanceAuthPass: environment.ATTENDANCE_AUTH_PASS,
    appOrigin: environment.APP_ORIGIN || null,
  });
}
