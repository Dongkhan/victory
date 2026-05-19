from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_relax_v15_blocks_false_completion_and_focuses_accessibility():
    html = read("relax-routine/prototype/v1.5.html")
    index = read("relax-routine/index.html")

    assert "Relax Routine v1.5" in html
    assert "relax-routine-v15-mobile-state" in html
    assert "relax-start-today-v15" in html
    assert "완료로 기록되지 않습니다" not in html[html.index("installCompletionObserver"):html.index("window.markRoutineCompletedOnNaturalFinish")]
    assert "data-completion-sentinel" in html
    assert "setLegacyInteractive(false" in html
    assert "inert" in html
    assert "env(safe-area-inset-top" in html
    assert "max-height:calc(100dvh" in html
    assert "prototype/v1.5.html" in index
    assert "최신 실행 파일은 v1.5" in index
    assert index.count("<small>latest</small>") == 1


def test_cbti_v13_updates_reason_badges_and_rejects_impossible_imports():
    html = read("cbti-care/prototype/v1.3.html")
    index = read("cbti-care/index.html")

    assert "CBT-I Care v1.3" in html
    assert "cbti-care-v13-state" in html
    assert "renderSrtReasonChips" in html
    assert "#srtReasonChips" in html
    assert "srtReasonBadges(srt).map" in html
    assert "sol<0||waso<0||nap<0" in html
    assert "Math.abs((sol+waso+tst)-tib)>45" in html
    assert "수면 구성 불일치" in html
    assert "prototype/v1.3.html" in index
    assert index.count("<small>latest</small>") == 1


def test_activacare_v12_records_actual_timer_exposure_not_target_duration_only():
    html = read("behavioral-activation/prototype/v1.2.html")
    index = read("behavioral-activation/index.html")
    prototype_index = read("behavioral-activation/prototype/index.html")

    assert "ActivaCare v1.2" in html
    assert "activacare-v12-state" in html
    assert "startedAt" in html
    assert "elapsedSeconds" in html
    assert "actualSeconds" in html
    assert "targetSeconds" in html
    assert "earlyCompletion" in html
    assert "실제 수행" in html
    assert "조기 완료" in html
    assert "prototype/v1.2.html" in index
    assert "v1.2.html" in prototype_index


def test_dhtalk_uses_writable_config_dir_and_targeted_alert_ack_close():
    main = read("dh-talk/src/main/index.js")
    server = read("dh-talk/src/main/server.js")
    alert = read("dh-talk/src/main/alert-window.js")
    app = read("dh-talk/src/renderer/App.jsx")

    assert "configDir = app.isPackaged" in main
    assert "path.join(dataDir, 'config')" in main
    assert "ensurePackagedConfig" in main
    assert "updateServerAuthToken" in server
    assert "export function getCurrentAlertId" in alert
    assert "closeAlert(msg?.id" in main
    assert "closeAlert(id = null)" in alert
    assert "msg.id === currentAlertRef.current?.id" in app
    assert "ACK 대상 알람이 현재 알람과 일치할 때만" in app
