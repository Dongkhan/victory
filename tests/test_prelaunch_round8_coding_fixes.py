from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_dhtalk_shared_key_fails_closed_before_server_or_socket_start():
    server = read("dh-talk/src/main/server.js")
    app = read("dh-talk/src/renderer/App.jsx")

    assert "function isUsableSharedKey" in server
    assert "CHANGE_ME_BEFORE_USE" in server
    assert "throw new Error('[server] shared_key_required:" in server
    assert "sharedKeyConnectionBlocked" in app
    assert "if (sharedKeyConnectionBlocked(sharedKey))" in app
    assert "return null" in app
    assert "공유키를 먼저 설정해야 연결합니다" in app


def test_relax_v14_does_not_record_completion_on_today_cta_start():
    html = read("relax-routine/prototype/v1.4.html")
    index = read("relax-routine/index.html")

    assert "Relax Routine v1.4" in html
    assert "relax-routine-v14-mobile-state" in html
    assert "relax-start-today-v14" in html
    assert "sessionStartedOnly" in html
    assert "function markRoutineCompletedOnNaturalFinish" in html
    start_fn = html[html.index("function startFocusedSession"):html.index("function markRoutineCompletedOnNaturalFinish")]
    assert "recordRoutineProgress" not in start_fn
    assert "완료 전에는 기록되지 않음" in html
    assert "prototype/v1.4.html" in index


def test_activacare_v09_gates_crisis_and_timer_completion():
    html = read("behavioral-activation/prototype/v0.9.html")
    index = read("behavioral-activation/index.html")
    prototype_index = read("behavioral-activation/prototype/index.html")

    assert "ActivaCare v0.9" in html
    assert "activacare-v09-state" in html
    assert "id=\"crisisSafetyPanel\"" in html
    assert "hasCrisisBlock" in html
    assert "자살예방상담전화 109" in html
    assert "보건소 생명존중사업" in html
    assert "btn.disabled=!enabled" in html
    assert "timerCompleted=true" in html
    assert "if(!timerCompleted)" in html
    assert "setRiskChoiceVisuals" in html
    assert "prototype/v0.9.html" in index
    assert "v0.9.html" in prototype_index


def test_cbti_v12_has_version_consistency_and_srt_reason_badges():
    html = read("cbti-care/prototype/v1.2.html")
    index = read("cbti-care/index.html")

    assert "CBT-I Care v1.2" in html
    assert "cbti-care-v12-state" in html
    assert '<div class="ver">v1.2</div>' in html
    assert "id=\"srtReasonChips\"" in html
    assert "function srtReasonBadges" in html
    assert "자료 신뢰도 낮음" in html
    assert "보류 사유" in html
    assert "TST/TIB 오류" in html
    assert "prototype/v1.2.html" in index
