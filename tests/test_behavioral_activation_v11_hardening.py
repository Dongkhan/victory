from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_v11_snapshot_is_preserved_with_isolated_storage_and_links():
    html = read("behavioral-activation/prototype/v1.1.html")
    landing = read("behavioral-activation/index.html")
    prototype_index = read("behavioral-activation/prototype/index.html")
    readme = read("behavioral-activation/README.md")

    assert "ActivaCare v1.1" in html
    assert "activacare-v11-state" in html
    assert "current version file: v1.1.html" in html
    assert "v1.2.html" in prototype_index
    assert "prototype/v1.1.html" in landing
    assert "현재 버전:</strong> v1.2" in landing
    assert "prototype/v1.2.html" in readme
    assert "v1.0.html" in landing  # preserve previous immutable version link


def test_checkout_turns_result_into_next_prescription_data():
    html = read("behavioral-activation/prototype/v1.1.html")

    assert "outcomeSelect" in html
    assert "nextDosePlan" in html
    assert "function applyPostOutcomeAdjustment" in html
    assert "예상보다 어려움 → 다음 처방 자동 축소" in html
    assert "예상보다 쉬움 → 같은 영역에서 조금 확장" in html
    assert "rec.nextPrescription" in html
    assert "다음 처방으로 반영" in html


def test_redesign_failure_auto_updates_today_prescription_not_only_logs():
    html = read("behavioral-activation/prototype/v1.1.html")

    assert "function applyRedesignToPrescription" in html
    assert "state.lastRedesignReason" in html
    assert "재설계 내용을 Today 처방에 즉시 반영" in html
    assert "30초 접촉" in html
    assert "조건 재설계 데이터로 저장하고 Today 처방을 낮췄습니다" in html


def test_life_map_scores_are_history_based_not_static_demo_numbers():
    html = read("behavioral-activation/prototype/v1.1.html")

    assert "function domainStats" in html
    assert "function domainScore" in html
    assert "const stats=domainStats(name)" in html
    assert "history.filter(x=>x.domain===domain" in html
    assert "기록 기반" in html
    assert "score:62" not in html
    assert "score:38" not in html


def test_clinic_summary_is_copy_ready_with_safety_and_pattern_sentences():
    html = read("behavioral-activation/prototype/v1.1.html")

    assert "function buildClinicSummaryText" in html
    assert "외래 공유용 요약" in html
    assert "최근 7일 행동활성화 기록" in html
    assert "주요 실패 조건" in html
    assert "다음 처방 제안" in html
    assert "생명존중사업" in html
    assert "pattern-based next action" not in html


def test_mobile_bottom_layout_has_explicit_modal_and_timer_safe_spacing():
    html = read("behavioral-activation/prototype/v1.1.html")

    assert "--timerbar" in html
    assert "padding-bottom:calc(var(--timerbar) + var(--nav)" in html
    assert "bottom:calc(var(--nav) + env(safe-area-inset-bottom" in html
    assert "max-height:calc(100dvh - 96px" in html
