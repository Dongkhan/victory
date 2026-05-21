// Hermes VPS 경유 Telegram 미러링 (CLAUDE.md §12).
// 미러링 실패는 메인 메시지 흐름을 막지 않는다 — 로그만 남기고 조용히 넘어간다.
// 환경변수는 호출 시점에 읽는다 (.env 가 늦게 로드돼도 안전).

export async function mirror(message, options = {}) {
  if (options.enabled !== true) return;
  if (!message?.mirror_to?.includes('telegram')) return;

  const apiKey = process.env.DHTALK_API_KEY;
  if (!apiKey) {
    console.error('[hermes-mirror] DHTALK_API_KEY 미설정 — 미러링 건너뜀');
    return;
  }
  const baseUrl = options.url || process.env.HERMES_URL;
  if (!baseUrl) {
    console.error('[hermes-mirror] URL 미설정 — 미러링 건너뜀');
    return;
  }

  let relayUrl;
  try {
    relayUrl = new URL('/dhtalk/relay', baseUrl);
    const allowInsecureHttp = options.allow_insecure_http === true || process.env.DHTALK_ALLOW_INSECURE_HTTP === 'true';
    if (relayUrl.protocol !== 'https:' && !(relayUrl.protocol === 'http:' && allowInsecureHttp)) {
      console.error('[hermes-mirror] HTTPS URL 필요 — 미러링 건너뜀');
      return;
    }
  } catch (_) {
    console.error('[hermes-mirror] URL 형식 오류 — 미러링 건너뜀');
    return;
  }

  try {
    const res = await fetch(relayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        sender: message.sender,
        body: message.body,
        patient_name: message.patient_name ?? null,
        alert_level: message.alert_level ?? null,
        ts: message.ts,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error('[hermes-mirror] 응답 오류:', res.status);
    }
  } catch (err) {
    console.error('[hermes-mirror]', err.message);
  }
}
