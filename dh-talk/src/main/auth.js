import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// WebSocket 인증 — shared secret 기반 nonce/HMAC 챌린지 (개선분석 1순위).

export function makeNonce() {
  return randomBytes(16).toString('hex');
}

export function signNonce(key, nonce) {
  return createHmac('sha256', String(key)).update(String(nonce)).digest('hex');
}

// 클라이언트가 보낸 HMAC 이 nonce 에 대해 유효한지 (timing-safe 비교).
export function verifyHmac(key, nonce, provided) {
  if (!key || typeof provided !== 'string') return false;
  const expected = signNonce(key, nonce);
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}
