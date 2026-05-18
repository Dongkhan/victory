// WebSocket 인증용 HMAC 계산 (renderer — Web Crypto API).
// main/auth.js 의 signNonce 와 동일한 HMAC-SHA256(key, nonce) hex 를 만든다.

export async function computeHmac(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(key)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(String(message)));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
