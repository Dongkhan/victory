from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_dhtalk_shared_key_can_be_saved_from_gui_through_preload_and_ipc():
    app = read("dh-talk/src/renderer/App.jsx")
    preload = read("dh-talk/src/main/preload.cjs")
    ipc = read("dh-talk/src/main/ipc.js")
    config = read("dh-talk/src/main/config.js")
    assert "saveSettings" in preload
    assert "config:save-settings" in ipc
    assert "writeSettings" in config
    assert "공유키 저장" in app
    assert "새 공유키" in app
    assert "settingsDraft" in app
    assert "20자 이상" in app


def test_behavioral_activation_v04_uses_real_dates_for_seven_day_success_analysis():
    html = read("behavioral-activation/prototype/v0.4.html")
    index = read("behavioral-activation/index.html")
    assert "ActivaCare v0.4" in html
    assert "activacare-v04-state" in html
    assert "function recentWindow" in html
    assert "function weekdaySuccessStats" in html
    assert "function timeBandSuccessStats" in html
    assert "요일별 성공률" in html
    assert "시간대별 성공률" in html
    assert "prototype/v0.4.html" in index


def test_cbti_v07_has_qa_seed_and_import_controls():
    html = read("cbti-care/prototype/v0.7.html")
    index = read("cbti-care/index.html")
    assert "CBT-I Care v0.7" in html
    assert "function seedSevenDayQaData" in html
    assert "function importClinicData" in html
    assert "QA 7일 데이터 입력" in html
    assert "데이터 가져오기" in html
    assert "prototype/v0.7.html" in index


def test_relax_v07_tracks_progress_from_actual_routine_clicks():
    html = read("relax-routine/prototype/v0.7.html")
    index = read("relax-routine/index.html")
    assert "Relax Routine v0.7" in html
    assert "relax-routine-v07-mobile-state" in html
    assert "function recordRoutineProgress" in html
    assert "document.addEventListener('click'" in html
    assert "lastRoutineLabel" in html
    assert "실행 버튼과 진도 저장 직접 연결" in html
    assert "prototype/v0.7.html" in index
