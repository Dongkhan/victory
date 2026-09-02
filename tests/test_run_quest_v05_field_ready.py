"""러닝퀘스트 v0.5 — 실사용 준비판 회귀 테스트.

백그라운드 GPS·네이티브 음성·가져오기·저장 관리·코스 형태 매칭·GPS 스무딩·PWA.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "run-quest" / "prototype" / "v0.5.html"
HTML = APP.read_text(encoding="utf-8")


def test_latest_build_is_offline_and_dependency_free():
    assert not re.search(r"<script[^>]+src=", HTML)
    assert not re.search(r"<link[^>]+stylesheet", HTML)
    assert "http://" not in HTML
    for host in ("cdn.", "googleapis", "unpkg", "jsdelivr", "overpass", "openstreetmap"):
        assert host not in HTML
    for sink in ("fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon"):
        assert sink not in HTML


def test_latest_build_is_the_one_linked_everywhere():
    assert "run-quest/prototype/v0.5.html" in (ROOT / "index.html").read_text(encoding="utf-8")
    assert "./prototype/v0.5.html" in (ROOT / "run-quest/index.html").read_text(encoding="utf-8")
    cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    targets = {r["source"]: r["destination"] for r in cfg["redirects"]}
    for src in ("/run", "/running", "/run-quest", "/run-quest/prototype/v0.1.html",
                "/run-quest/prototype/v0.2.html", "/run-quest/prototype/v0.2.1.html",
                "/run-quest/prototype/v0.2.2.html", "/run-quest/prototype/v0.3.html",
                "/run-quest/prototype/v0.4.html"):
        assert targets.get(src) == "/run-quest/prototype/v0.5.html", src


# ── 네이티브 브리지 ────────────────────────────────────────
def test_native_bridge_falls_back_to_web_apis():
    """Capacitor 안에서만 네이티브를 쓰고, 브라우저·PWA에서는 웹 API로 자동 폴백."""
    assert "var IS_NATIVE = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());" in HTML
    assert "function hasNative(plugin)" in HTML and "Cap.PluginHeaders" in HTML
    for name in ("TextToSpeech", "BackgroundGeolocation", "KeepAwake"):
        assert 'hasNative("%s")' % name in HTML, name
    assert "Cap.nativePromise(" in HTML and "Cap.nativeCallback(" in HTML


def test_background_tracking_keeps_running_with_screen_off():
    assert "function startNativeGeo()" in HTML
    geo = HTML[HTML.index("function startNativeGeo()"):HTML.index("function startWebGeo()")]
    assert '"BackgroundGeolocation", "addWatcher"' in geo
    assert "backgroundTitle" in geo and "backgroundMessage" in geo          # 포그라운드 서비스 알림
    assert "requestPermissions: true, stale: false, distanceFilter: 3" in geo
    assert 'err.code === "NOT_AUTHORIZED"' in geo                            # 거부 시 데모로
    assert HTML.count('"BackgroundGeolocation", "removeWatcher"') == 2      # 종료·데모 전환 시 해제
    assert "if(id == null){ startWebGeo(); return; }" in geo                # 플러그인 실패 시 웹 폴백


def test_voice_uses_native_tts_when_available():
    spk = HTML[HTML.index("function speak(text, urgent)"):HTML.index("function coach(")]
    assert 'nativeCall("TextToSpeech", "speak"' in spk
    assert 'lang:"ko-KR"' in spk
    assert "queueStrategy: urgent ? 0 : 1" in spk                            # 추격 경고는 끊고 말한다
    assert "speechSynthesis" in spk                                          # 웹 폴백
    assert '초 동안 페이스를 올려요!", true);' in HTML


def test_keep_awake_prefers_native():
    assert 'nativeCall("KeepAwake", "keepAwake")' in HTML
    assert 'nativeCall("KeepAwake", "allowSleep")' in HTML


# ── 가져오기 · 저장 관리 ──────────────────────────────────
def test_import_merges_records_from_another_phone():
    assert 'id="btnImport"' in HTML and 'id="importInput"' in HTML
    assert "function normalizeImport(o)" in HTML
    norm = HTML[HTML.index("function normalizeImport(o)"):HTML.index("function mergeInto(target, inc)")]
    for v in ("o.v === 5", "o.v === 4", "o.v === 3", "o.v === 2"):
        assert v in norm, v                                                  # 모든 옛 버전 파일 수용
    merge = HTML[HTML.index("function mergeInto(target, inc)"):HTML.index('$("#btnImport")')]
    assert "packCell(Math.min(firstDay(cur), firstDay(v)), visitsOf(cur) + visitsOf(v))" in merge   # 같은 칸은 방문 합산
    assert "if(!ids[x.id]){ target.sessions.push(x);" in merge              # 겹치는 기록은 한 번만
    assert "target.profile.xp = Math.max(target.profile.xp, inc.profile.xp || 0);" in merge
    assert "러닝퀘스트 내보내기 파일이 아니에요." in HTML


def test_storage_stays_under_the_quota():
    assert "var KEEP_POINTS_SESSIONS = 60;" in HTML
    assert "function trimStorage()" in HTML
    assert "points: downsample(r.points, 120)" in HTML                       # 300 → 120
    fl = HTML[HTML.index("function flush()"):HTML.index("/* ---------------- 레벨")]
    assert "trimStorage();" in fl
    assert "delete S.photos[keys[0]]; continue;" in fl                       # 1순위: 오래된 사진
    assert "victim.points = []; victim.trimmed = true; continue;" in fl      # 2순위: 오래된 경로
    assert 'id="storageInfo"' in HTML and "한도 약 5MB" in HTML
    assert "오래된 기록이라 경로는 생략됐어요" in HTML


# ── 코스 형태 매칭 · GPS 스무딩 ──────────────────────────
def test_routes_match_by_shape_not_only_start_and_distance():
    assert "function fpSimilarity(a, b)" in HTML
    assert "if(fpSimilarity(r.fp, fp) < 0.8) continue;" in HTML
    assert "fp: [0,0,0,0,0,0,0,0],// 코스 지문" in HTML
    assert "run.fp[dirOfPoint(hv.x, hv.y)] += d;" in HTML                   # 방위별 거리 누적
    assert "if(!a || !b) return 1;" in HTML                                  # 지문 없는 옛 기록은 관대하게


def test_gps_jitter_is_smoothed_before_painting():
    assert "function smoothed(p, acc)" in HTML
    assert "var alpha = acc <= 10 ? 0.7 : acc <= 20 ? 0.5 : 0.35;" in HTML  # 정확도별 가중치
    assert "if(a && b && acc <= 30) paintSegment(a, b, paintCell);" in HTML # 30m 넘으면 칠하지 않음
    assert "if(acc > 45 && !run.demo) return;" in HTML                       # 거리 자체는 45m까지


def test_live_map_redraw_is_throttled_for_battery():
    assert "(changed && now2 - run.lastDrawAt >= 400) || (animating && now2 - run.lastDrawAt >= 1000)" in HTML


# ── PWA ──────────────────────────────────────────────────
def test_pwa_is_installable_but_not_registered_inside_the_app():
    assert '<link rel="manifest" href="../manifest.webmanifest">' in HTML
    assert '<link rel="apple-touch-icon" href="../icons/icon-192.png">' in HTML
    assert 'navigator.serviceWorker.register("../sw.js", { scope: "../" })' in HTML
    assert 'if(!IS_NATIVE && "serviceWorker" in navigator && /^https?:$/.test(location.protocol))' in HTML
    man = json.loads((ROOT / "run-quest/manifest.webmanifest").read_text(encoding="utf-8"))
    assert man["start_url"] == "./prototype/v0.5.html" and man["display"] == "standalone"
    assert any(i.get("purpose") == "maskable" for i in man["icons"])
    for icon in man["icons"]:
        assert (ROOT / "run-quest" / icon["src"]).exists(), icon["src"]
    sw = (ROOT / "run-quest/sw.js").read_text(encoding="utf-8")
    assert 'var CACHE = "runquest-v0.5";' in sw and "./prototype/v0.5.html" in sw


def test_browser_smoke_lives_in_the_repo_and_ci():
    assert (ROOT / "tests/test_run_quest_browser_smoke.py").exists()
    wf = (ROOT / ".github/workflows/run-quest-web.yml").read_text(encoding="utf-8")
    assert "playwright install --with-deps chromium" in wf
    assert "test_run_quest_browser_smoke.py" in wf
    assert 'RUNQUEST_BROWSER: "1"' in wf


def test_safety_and_accessibility_contracts_hold():
    assert HTML.count('class="safety"') >= 3
    assert "의료기기가 아니며" in HTML and "119" in HTML and "가슴 통증" in HTML
    assert "prefers-reduced-motion" in HTML and 'data-opt="reduceMotion"' in HTML
    assert ":focus-visible" in HTML and "outline:none" not in HTML
    assert "--tap:44px" in HTML
    assert 'role="tablist"' in HTML and HTML.count('role="switch"') == 8
    assert "[hidden]{display:none !important}" in HTML
    assert "차 없는 넓은 코스에서만" in HTML


def test_no_ads_or_tracking_or_payment_hooks():
    lowered = HTML.lower()
    for banned in ("gtag", "analytics", "adsbygoogle", "facebook", "iap", "purchase"):
        assert banned not in lowered
