from pathlib import Path
import gzip

ROOT = Path(__file__).resolve().parents[1]

def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")

def test_ba_v15_has_risk_flow_avoidance_engine_and_accessible_life_map():
    html = read("behavioral-activation/prototype/v1.5.html")
    index = read("behavioral-activation/index.html")
    assert "ActivaCare v1.5" in html
    assert "activacare-v15-state" in html
    assert "legacyStoreKey='activacare-v14-state'" in html
    assert "avoidanceSelect" in html and "회피 유형" in html
    assert "function prescribeByMode" in html
    assert "aria-label=\"${name} 영역" in html
    assert "행동 처방 잠금" in html and "지역 위기지원기관" in html
    assert "오늘은 하나만 작게 시작합니다" in html
    assert "2분 행동 시작하기" in html
    assert "제목만 열면 성공" in html
    assert "20초 상태 확인 후 시작" not in html
    assert "목표는 완성이 아니라 시작 증거" not in html
    assert "prototype/v1.5.html" in index

def test_cbti_v15_has_safety_intake_gate_and_latest_index():
    html = read("cbti-care/prototype/v1.5.html")
    index = read("cbti-care/index.html")
    assert "CBT-I Care v1.5" in html
    assert "cbti-care-v15-state" in html
    assert "LEGACY_KEY='cbti-care-v14-state'" in html
    assert "첫 사용 안전 게이트" in html
    assert "data-safety=\"suicide\"" in html
    assert "function safetyHardFlags" in html
    assert "route('screen-dashboard')" in html
    assert "prototype/v1.5.html" in index
    assert 'prototype/v1.4.html">CBT-I Care v1.4</a><br>' in index


def test_cbti_v16_compresses_home_and_adds_breathing_mode_without_life_respect_program():
    html = read("cbti-care/prototype/v1.6.html")
    index = read("cbti-care/index.html")
    assert "CBT-I Care v1.6" in html
    assert "cbti-care-v16-state" in html
    assert "LEGACY_KEY='cbti-care-v15-state'" in html
    assert "오늘은 하나만 해도 됩니다" in html
    assert "오늘의 시작" in html
    assert "수면일기 저장하기" in html
    assert "1분 호흡으로 진정하기" in html
    assert "수면 제한 전 확인" in html
    assert "복식호흡 1분으로 각성 낮추기" not in html
    assert "안전 기준 먼저 확인" not in html
    assert "todayFocusCard" in html
    assert "screen-breath" in html
    assert "복식호흡 1분" in html
    assert "function startBreathMode" in html
    assert "지역 위기지원기관" in html
    assert "생명존중" not in html
    assert "prototype/v1.6.html" in index
    assert 'prototype/v1.5.html">CBT-I Care v1.5</a><br>' in index

def test_rr_v22_is_lightweight_and_preserves_latest_lineage():
    html_path = ROOT / "relax-routine/prototype/v2.2.html"
    html = html_path.read_text(encoding="utf-8")
    index = read("relax-routine/index.html")
    raw = html_path.read_bytes()
    assert "Relax Routine v2.2" in html
    assert "relax-routine-v22-mobile-state" in html
    assert "relax-routine-v15-mobile-state" in html
    assert len(raw) < 1_200_000
    assert len(gzip.compress(raw)) < 350_000
    assert "function hasCompletedOnboarding" in html
    assert "function isOnboardingVisible" in html
    assert "소리 없이 진행 가능 · 언제든 중단 가능" in html
    assert "React.createElement(\\\"br\\\", null)" in html
    assert "어지럽거나 불편하면 멈추세요" in html
    assert "let focusedPanelSuppressed=false" in html
    assert "focusedPanelSuppressed=true" in html
    assert "focusedHomeChoice:'추천만 보기'" in html
    assert "function startFocusedSession(label, panel){" in html
    assert "if(focusedPanelSuppressed) return;" in html
    assert "if(!hasCompletedOnboarding() || isOnboardingVisible()) return;" in html
    assert "new MutationObserver(()=>" in html
    assert "relax-home-copy-polish-v22" in html
    assert "2분만에 내 루틴 찾기" in html
    assert "바로 체험하기" in html
    assert "전문의가 설계한 근거 기반 이완 루틴" in html
    assert "prototype/v2.2.html" in index
    assert 'prototype/v2.1.html">Relax Routine v2.1</a><br>' in index


def test_rr_v23_polishes_home_copy_and_removes_duplicate_breathing_cta():
    html_path = ROOT / "relax-routine/prototype/v2.3.html"
    html = html_path.read_text(encoding="utf-8")
    index = read("relax-routine/index.html")
    raw = html_path.read_bytes()
    assert "Relax Routine v2.3" in html
    assert "relax-routine-v23-mobile-state" in html
    assert "relax-routine-v22-mobile-state" in html
    assert len(raw) < 1_200_000
    assert len(gzip.compress(raw)) < 350_000
    assert "relax-home-copy-layout-hotfix-v23" in html
    assert "relax-greeting-font-v23" in html
    assert "좋은 아침이에요. 오늘도 차분하게 시작해볼까요?" in html
    assert "소리 없이 진행 가능 · 언제든 중단 가능 · 완료 후에만 기록됩니다" in html
    assert "어지럽거나 불편하면 바로 멈추세요." in html
    assert "removeDuplicateBreathing" in html
    assert "지금 바로 호흡" in html and "4-7-8" in html
    assert "prototype/v2.3.html" in index
    assert 'prototype/v2.2.html">Relax Routine v2.2</a><br>' in index
    assert "최신 실행 파일은 v2.3" in index
