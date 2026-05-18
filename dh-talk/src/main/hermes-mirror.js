// Hermes VPS 경유 Telegram 미러링 (CLAUDE.md §12).
// 미러링 실패는 메인 메시지 흐름을 막지 않는다 — 로그만 남기고 조용히 넘어간다.
// 환경변수는 호출 시점에 읽는다 (.env 가 늦게 로드돼도 안전).
// 환자 정보가 포함될 수 있으므로 HERMES_URL 은 명시적 opt-in + HTTPS 만 허용한다.

export function resolveHermesRelayUrl(env = process.env) {
  const raw = env.HERMES_URL?.trim();
  if (!raw) {
    return { ok: false, reason: 'HERMES_URL 미설정' };
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: 'HERMES_URL 형식 오류' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'HERMES_URL은 https:// 주소만 허용' };
  }

  parsed.pathname = parsed.pathname.replace(/\/$/, '');
  return { ok: true, url: `${parsed.toString().replace(/\/$/, '')}/dhtalk/relay` };
}

export async function mirror(message) {
  if (!message?.mirror_to?.includes('telegram')) return;

  const apiKey = process.env.DHTALK_API_KEY;
  if (!apiKey) {
    console.error('[hermes-mirror] DHTALK_API_KEY 미설정 — 미러링 건너뜀');
    return;
  }

  const relay = resolveHermesRelayUrl();
  if (!relay.ok) {
    console.error(`[hermes-mirror] ${relay.reason} — 환자 정보 보호를 위해 미러링 건너뜀`);
    return;
  }

  try {
    const res = await fetch(relay.url, {
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
