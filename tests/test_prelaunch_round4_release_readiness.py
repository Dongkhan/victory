from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_relax_v10_uses_real_mobile_viewport_and_single_primary_home_cta():
    html = read("relax-routine/prototype/v1.0.html")
    index = read("relax-routine/index.html")
    assert "Relax Routine v1.0" in html
    assert "relax-routine-v10-mobile-state" in html
    assert "user-scalable=no" not in html
    assert "maximum-scale" not in html
    assert "relax-simple-home-v10" in html
    assert "오늘의 세션만 보기" in html
    assert "aria-label='오늘의 추천 세션 시작'" in html or 'aria-label="오늘의 추천 세션 시작"' in html
    assert "relax-start-today-v10" in html
    assert "prototype/v1.0.html" in index


def test_cbti_v10_calculates_7_day_srt_window_with_safety_floor():
    html = read("cbti-care/prototype/v1.0.html")
    index = read("cbti-care/index.html")
    assert "CBT-I Care v1.0" in html
    assert "cbti-care-v10-state" in html
    assert "function calculateSrtRecommendation" in html
    assert "권고 수면창" in html
    assert "최소 5시간 안전 하한" in html
    assert "평균 TST + 30분" in html
    assert "prototype/v1.0.html" in index


def test_behavioral_activation_v07_shows_reason_and_weekly_success_trend():
    html = read("behavioral-activation/prototype/v0.7.html")
    index = read("behavioral-activation/index.html")
    assert "ActivaCare v0.7" in html
    assert "activacare-v07-state" in html
    assert "function weeklySuccessTrend" in html
    assert "성공률 추이" in html
    assert "추천 근거" in html
    assert "가장 성공률이 높은 조건" in html
    assert "prototype/v0.7.html" in index


def test_dhtalk_diagnostics_have_actionable_severity_and_fix_guides():
    app = read("dh-talk/src/renderer/App.jsx")
    css = read("dh-talk/src/renderer/styles.css")
    assert "diagnosticSeverity" in app
    assert "diagnosticFixGuide" in app
    assert "정상" in app and "주의" in app and "오류" in app
    assert "방화벽" in app and "같은 공유키" in app and "20자 이상" in app
    assert "app__diagnostic--ok" in css
    assert "app__diagnostic--warn" in css
    assert "app__diagnostic--error" in css
