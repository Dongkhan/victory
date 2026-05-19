from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_activacare_v10_is_current_version_with_isolated_storage():
    html = read("behavioral-activation/prototype/v1.0.html")
    landing = read("behavioral-activation/index.html")
    prototype_index = read("behavioral-activation/prototype/index.html")

    assert "ActivaCare v1.0" in html
    assert "activacare-v10-state" in html
    assert "viewport-fit=cover" in html
    assert "prototype/v1.0.html" in landing
    assert "v1.0.html" in prototype_index
    assert "현재 버전:</strong> v1.0" in landing


def test_difficulty_adjustment_is_stateful_and_changes_today_card():
    html = read("behavioral-activation/prototype/v1.0.html")

    assert "function shrinkAction" in html
    assert "state.shrinkLevel" in html
    assert "shrinkTemplates" in html
    assert "data-shrink-step" in html
    assert "오늘의 30초 버전" in html
    assert "state.expectedDifficulty=Math.max" in html
    assert "renderTodayAction" in html
    assert "난이도를 낮춘 처방으로 바꿨습니다" in html

    old_brittle_logic = "state.action=state.action.replace(/하기|쓰기|걷기|열기/g,'시작하기').slice(0,38)"
    assert old_brittle_logic not in html


def test_running_timer_has_explicit_control_mode_not_just_hidden_timer():
    html = read("behavioral-activation/prototype/v1.0.html")

    assert "id=\"activeTimerBar\"" in html
    assert "id=\"pauseTimerBtn\"" in html
    assert "id=\"cancelTimerBtn\"" in html
    assert "id=\"finishNowBtn\"" in html
    assert "function startTimer" in html
    assert "function pauseTimer" in html
    assert "function cancelTimer" in html
    assert "if(!silent){renderRedesignChoices();openModal('redesignModal');showToast('중단은 실패가 아니라 조건 재설계 데이터입니다.')}" in html
    assert "function finishTimerEarly" in html
    assert "실행 중에는 이 막대에서 중단·완료를 직접 선택합니다" in html
    assert "state.timer.status" in html


def test_crisis_lock_blocks_behavior_prescription_fail_closed():
    html = read("behavioral-activation/prototype/v1.0.html")

    assert "function applyCrisisLock" in html
    assert "hasCrisisBlock()" in html
    assert "preCheckBtn.disabled=blocked" in html
    assert "shrinkBtn.disabled=blocked" in html
    assert "failBtn.disabled=blocked" in html
    assert "saveAction.disabled=blocked" in html
    assert "applyRecommendBtn.disabled=blocked" in html
    assert "행동 처방 잠금" in html
    assert "자살예방상담전화 109" in html
    assert "보건소 생명존중사업" in html


def test_precheck_modal_and_bottom_spacing_are_mobile_safe():
    html = read("behavioral-activation/prototype/v1.0.html")

    assert "safe-area-inset-bottom" in html
    assert "padding-bottom:calc(160px + env(safe-area-inset-bottom" in html
    assert "range-scale" in html
    assert "/10" in html
    assert "체크 완료하고 시작" in html
    assert "터치 영역 44px" in html
