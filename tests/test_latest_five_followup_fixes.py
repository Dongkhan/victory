from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_root_index_exposes_actual_latest_products():
    index = read("index.html")
    assert "최신 v3.2" in index
    assert "최신 v2.8" in index
    assert "v2.272" in index
    assert "DH-TALK_V2/app/" in index
    assert "messages/call_alerts" in index


def test_rr_pmr_v3_does_not_hijack_background_knowledge_text():
    html = read("relax-routine/prototype/v3.1.html")
    assert "function isPmrLauncher" in html
    assert "배경지식/교육 화면의 PMR 텍스트는 지식 설명으로 남겨야 한다" in html
    assert "Jacobson|16개 근육군|근거|읽기" in html
    assert "if(looksOld&&!overlayOpen)open();" not in html


def test_ba_v28_has_stable_cta_smoke_hook_and_fail_closed_safety():
    html = read("behavioral-activation/prototype/v2.8.html")
    assert 'id="preCheckBtn" type="button"' in html
    assert "data-smoke-state','ba-precheck-open" in html
    assert "안전 위험이 있으면 행동 실행보다 도움 연결이 우선" in html
    assert "행동 실행 잠금" in html


def test_cbti_prototype_index_metadata_points_to_v2272():
    index = read("cbti-care/prototype/index.html")
    assert "CBT-I Care v2.272" in index
    assert "SRT 안전 스크리닝" in index


def test_dfc_start_route_has_screen_hook_and_stronger_safety_gate():
    html = read("family-link-coach/index.html")
    assert "document.body.setAttribute('data-screen',screen)" in html
    assert "앱 규칙 조정을 중단하고 보호자·전문가·응급기관 도움이 우선" in html


def test_dht2_call_alerts_are_backed_by_supabase_repository():
    app = read("DH-TALK_V2/app/src/App.tsx")
    repo = read("DH-TALK_V2/app/src/data/callRepository.ts")
    realtime = read("DH-TALK_V2/app/src/data/callRealtime.ts")
    assert "createSupabaseCallRepository" in app
    assert "subscribeToCallAlertChanges" in app
    assert ".from('messages')" in repo
    assert ".from('call_alerts')" in repo
    assert "acknowledged_at" in repo
    assert "table: 'call_alerts'" in realtime
