import jwt, { SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_TTL = (process.env.JWT_ACCESS_TTL || '15m') as SignOptions['expiresIn'];
const REFRESH_TTL = (process.env.JWT_REFRESH_TTL || '7d') as SignOptions['expiresIn'];

export interface AccessPayload {
  uid: string;
  role: 'USER' | 'ADMIN';
  type: 'PF' | 'PJ';
}

export function signAccess(payload: AccessPayload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefresh(payload: { uid: string; sid: string }) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyAccess(token: string): AccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

export function verifyRefresh(token: string): { uid: string; sid: string } {
  return jwt.verify(token, REFRESH_SECRET) as { uid: string; sid: string };
}

export function refreshExpiryDate(): Date {
  const days = parseInt(String(REFRESH_TTL).replace('d', ''), 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
