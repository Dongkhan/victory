from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_relax_v11_promotes_one_session_home_and_deemphasizes_full_content():
    html = read("relax-routine/prototype/v1.1.html")
    index = read("relax-routine/index.html")
    assert "Relax Routine v1.1" in html
    assert "relax-routine-v11-mobile-state" in html
    assert "relax-focused-home-v11" in html
    assert "오늘은 이것만 하면 됩니다" in html
    assert "기존 전체 안내는 아래에 접었습니다" in html
    assert "data-testid=\"session-clarity-panel\"" in html
    assert "relax-start-today-v11" in html
    assert "user-scalable=no" not in html
    assert "maximum-scale" not in html
    assert "prototype/v1.1.html" in index


def test_cbti_v11_classifies_sleep_window_readiness_states():
    html = read("cbti-care/prototype/v1.1.html")
    index = read("cbti-care/index.html")
    assert "CBT-I Care v1.1" in html
    assert "cbti-care-v11-state" in html
    assert "function classifySrtRecommendation" in html
    assert "적용 가능" in html
    assert "보류" in html
    assert "진료 확인 필요" in html
    assert "data-srt-status" in html
    assert "권고 수면창은 자동 처방이 아니라 진료 확인용 계산값" in html
    assert "prototype/v1.1.html" in index


def test_behavioral_activation_v08_renders_record_based_trend_bars_and_clinical_reason():
    html = read("behavioral-activation/prototype/v0.8.html")
    index = read("behavioral-activation/index.html")
    prototype_index = read("behavioral-activation/prototype/index.html")
    assert "ActivaCare v0.8" in html
    assert "activacare-v08-state" in html
    assert "function renderSuccessTrendChart" in html
    assert "success-trend-bar" in html
    assert "data-rate" in html
    assert "최근 7일 실제 수행 기록 기반" in html
    assert "가치 영역" in html and "마찰이 낮은 조건" in html
    assert "prototype/v0.8.html" in index
    assert "v0.8.html" in prototype_index


def test_dhtalk_diagnostics_show_role_specific_step_checklist():
    app = read("dh-talk/src/renderer/App.jsx")
    css = read("dh-talk/src/renderer/styles.css")
    assert "diagnosticChecklistSteps" in app
    assert "서버 PC에서" in app
    assert "접수/진료 PC에서" in app
    assert "Windows 방화벽" in app
    assert "WebSocket 상태" in app
    assert "aria-label=\"연결 문제 해결 체크리스트\"" in app
    assert "app__checklist" in css
    assert "app__checklist-step" in css
