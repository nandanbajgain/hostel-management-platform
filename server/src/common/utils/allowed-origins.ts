export function getAllowedOrigins() {
  const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173';

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin?: string | null) {
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(origin);
}
