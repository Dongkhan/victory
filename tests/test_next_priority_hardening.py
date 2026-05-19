from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_dhtalk_connection_and_shared_key_ux_is_visible():
    app = read("dh-talk/src/renderer/App.jsx")
    css = read("dh-talk/src/renderer/styles.css")
    assert "statusDetail" in app
    assert "auth_failed" in app
    assert "CHANGE_ME_BEFORE_USE" in app
    assert "공유키를 설정해야 합니다" in app
    assert "연결 실패" in app
    assert "app__status-detail" in css


def test_behavioral_activation_v03_adds_mobile_report_export_and_persistence_controls():
    html = read("behavioral-activation/prototype/v0.3.html")
    index = read("behavioral-activation/prototype/index.html")
    project = read("behavioral-activation/index.html")
    assert "ActivaCare v0.3" in html
    assert "activacare-v03-state" in html
    assert "function generateWeeklyReport" in html
    assert "function exportClinicReport" in html
    assert "function resetSavedData" in html
    assert "다운로드" in html
    assert "7일 외래 요약" in html
    assert "prototype/v0.3.html" in project
    assert "v0.3" in index


def test_relax_routine_v06_adds_mobile_storage_progress_and_export_shell():
    html = read("relax-routine/prototype/v0.6.html")
    index = read("relax-routine/index.html")
    assert "Relax Routine v0.6" in html
    assert "relax-routine-v06-mobile-state" in html
    assert "function exportRelaxRoutineData" in html
    assert "function resetRelaxRoutineProgress" in html
    assert "모바일 출시 준비" in html
    assert "진도 저장" in html
    assert "prototype/v0.6.html" in index


def test_cbti_v06_blocks_sleep_window_recommendation_before_seven_days():
    html = read("cbti-care/prototype/v0.6.html")
    index = read("cbti-care/index.html")
    assert "CBT-I Care v0.6" in html
    assert "function canRecommendSleepWindow" in html
    assert "7일 미만: 수면창 권고 보류" in html
    assert "수면창 권고는 최근 7일 이상 기록 후 표시" in html
    assert "prototype/v0.6.html" in index
