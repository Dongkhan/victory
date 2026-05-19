from pathlib import Path
import gzip

ROOT = Path(__file__).resolve().parents[1]

def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")

def test_ba_v14_has_risk_flow_avoidance_engine_and_accessible_life_map():
    html = read("behavioral-activation/prototype/v1.4.html")
    index = read("behavioral-activation/index.html")
    assert "ActivaCare v1.4" in html
    assert "activacare-v14-state" in html
    assert "legacyStoreKey='activacare-v13-state'" in html
    assert "avoidanceSelect" in html and "회피 유형" in html
    assert "function prescribeByMode" in html
    assert "aria-label=\"${name} 영역" in html
    assert "행동 처방 잠금" in html and "생명존중사업" in html
    assert "prototype/v1.4.html" in index

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
    assert "if(!hasCompletedOnboarding() || isOnboardingVisible()) return;" in html
    assert "new MutationObserver(()=>" in html
    assert "prototype/v2.2.html" in index
    assert 'prototype/v2.1.html">Relax Routine v2.1</a><br>' in index
