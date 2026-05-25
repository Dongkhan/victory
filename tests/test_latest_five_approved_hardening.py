from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def button_count(html: str) -> int:
    return len(re.findall(r"<button\b", html, re.I))


def typed_button_count(html: str) -> int:
    return len(re.findall(r"<button\b[^>]*\btype=", html, re.I))


def test_all_static_buttons_have_explicit_type_and_state_hooks():
    files = [
        "relax-routine/prototype/v3.1.html",
        "behavioral-activation/prototype/v2.8.html",
        "cbti-care/prototype/v2.272.html",
        "family-link-coach/index.html",
    ]
    for rel in files:
        html = read(rel)
        assert typed_button_count(html) == button_count(html), rel
        assert "dataset.app" in html, rel
        assert "dataset.version" in html, rel
        assert "dataset.screen" in html, rel
        assert "schema-version" in html, rel


def test_rr_uses_explicit_pmr_launcher_not_text_hijack():
    html = read("relax-routine/prototype/v3.1.html")
    assert "data-action='start-pmr'" in html or "dataset.action='start-pmr'" in html
    assert "b.dataset?.action==='start-pmr'||b.dataset?.rrModule==='pmr-v3'" in html
    assert "텍스트 감지가 아니라 명시적 실행 selector" in html
    assert "Jacobson" in html and "16개 근육군" in html
    assert "rr-v31-pmr-balloon-visual-restore" in html
    assert "rrPmrBalloonGrow" in html and "rrPmrBalloonShrink" in html
    assert "document.body.dataset.pmrBalloon='restored'" in html


def test_ba_crisis_route_guard_and_structured_clinic_report():
    html = read("behavioral-activation/prototype/v2.8.html")
    assert "ba-v28-approved-hardening" in html
    assert "document.body.dataset.crisisBlocked" in html
    assert "1. 7일 실행 횟수" in html
    assert "행동 실행 잠금" in html


def test_cbti_srt_fail_closed_and_cache_cleanup():
    html = read("cbti-care/prototype/v2.272.html")
    assert "cbti-v272-approved-hardening" in html
    assert "document.body.dataset.srtSafe" in html
    assert "SRT 안전 게이트 미통과" in html
    assert "caches.keys()" in html and "cbti-care-" in html
    assert "document.body.dataset.diaryValid" in html


def test_dfc_delegated_actions_crisis_lock_and_privacy_scopes():
    html = read("family-link-coach/index.html")
    assert 'onclick="' not in html
    assert "document.addEventListener('click',function(e)" in html
    assert "function hasCrisisLock" in html
    assert "data-crisis-lock" in html
    assert "data-privacy-scope=\"parent-only\"" in html
    assert "data-privacy-scope=\"child-visible\"" in html
    assert "data-privacy-scope=\"family\"" in html


def test_dht2_fallback_ack_competition_and_rls_doc():
    app = read("DH-TALK_V2/app/src/App.tsx")
    repo = read("DH-TALK_V2/app/src/data/callRepository.ts")
    types = read("DH-TALK_V2/app/src/domain/types.ts")
    doc = read("DH-TALK_V2/docs/supabase-call-alerts-rls.md")
    assert "syncError" in app and "마지막 호출 재시도" in app
    assert "syncState: 'failed'" in app
    assert ".eq('status', 'unread')" in repo
    assert "acknowledged_device" in repo
    assert "acknowledgedDevice" in types
    assert "Enable RLS" in doc and "staff can close unread call alerts" in doc
