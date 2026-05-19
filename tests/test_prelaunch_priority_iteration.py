from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_dhtalk_settings_save_reconnects_without_manual_restart_and_masks_key():
    app = read("dh-talk/src/renderer/App.jsx")
    css = read("dh-talk/src/renderer/styles.css")
    assert "connectWebSocket" in app
    assert "reconnectAfterSettingsSave" in app
    assert "설정 저장 후 재연결" in app
    assert "공유키 저장 후 자동 재연결" in app
    assert "showSharedKey" in app
    assert "공유키 표시" in app
    assert "app__settings-hint" in css


def test_cbti_v08_validates_imported_sleep_diary_json_before_persisting():
    html = read("cbti-care/prototype/v0.8.html")
    index = read("cbti-care/index.html")
    assert "CBT-I Care v0.8" in html
    assert "cbti-care-v08-state" in html
    assert "function validateImportedEntries" in html
    assert "function normalizeImportedEntry" in html
    assert "가져오기 검증 실패" in html
    assert "date, tib, tst, se 필수" in html
    assert "prototype/v0.8.html" in index


def test_behavioral_activation_v05_generates_pattern_based_next_action_recommendation():
    html = read("behavioral-activation/prototype/v0.5.html")
    index = read("behavioral-activation/index.html")
    assert "ActivaCare v0.5" in html
    assert "activacare-v05-state" in html
    assert "function recommendNextAction" in html
    assert "다음 행동 추천" in html
    assert "가장 성공률이 높은 조건" in html
    assert "pattern-based next action" in html
    assert "prototype/v0.5.html" in index


def test_relax_v08_tracks_streak_and_session_completion_rate():
    html = read("relax-routine/prototype/v0.8.html")
    index = read("relax-routine/index.html")
    assert "Relax Routine v0.8" in html
    assert "relax-routine-v08-mobile-state" in html
    assert "function calculateRelaxStreak" in html
    assert "function calculateSessionCompletionRate" in html
    assert "연속 수행" in html
    assert "세션 완료율" in html
    assert "prototype/v0.8.html" in index
