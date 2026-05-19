from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_dhtalk_has_connection_diagnostics_panel_for_lan_setup():
    app = read("dh-talk/src/renderer/App.jsx")
    css = read("dh-talk/src/renderer/styles.css")
    assert "connectionDiagnostics" in app
    assert "runConnectionDiagnostics" in app
    assert "설정 진단" in app
    assert "서버 IP" in app and "공유키" in app and "WebSocket" in app
    assert "app__diagnostics" in css


def test_cbti_v09_detects_clinically_invalid_sleep_diary_input():
    html = read("cbti-care/prototype/v0.9.html")
    index = read("cbti-care/index.html")
    assert "CBT-I Care v0.9" in html
    assert "cbti-care-v09-state" in html
    assert "function validateDiaryEntry" in html
    assert "function diaryClinicalWarnings" in html
    assert "임상 오류 가능성" in html
    assert "TST가 TIB보다 클 수 없습니다" in html
    assert "prototype/v0.9.html" in index


def test_behavioral_activation_v06_applies_recommended_action_to_today_card():
    html = read("behavioral-activation/prototype/v0.6.html")
    index = read("behavioral-activation/index.html")
    assert "ActivaCare v0.6" in html
    assert "activacare-v06-state" in html
    assert "function applyRecommendedAction" in html
    assert "추천 행동 적용" in html
    assert "Today 카드에 반영" in html
    assert "prototype/v0.6.html" in index


def test_relax_v09_simplifies_home_and_recommends_next_routine():
    html = read("relax-routine/prototype/v0.9.html")
    index = read("relax-routine/index.html")
    assert "Relax Routine v0.9" in html
    assert "relax-routine-v09-mobile-state" in html
    assert "function simplifyRelaxHome" in html
    assert "오늘의 세션 시작" in html
    assert "정보를 줄인 홈" in html
    assert "function recommendRelaxRoutine" in html
    assert "routineHistory" in html
    assert "prototype/v0.9.html" in index
