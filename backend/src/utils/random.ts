import crypto from 'crypto';

export function token(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function code6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
