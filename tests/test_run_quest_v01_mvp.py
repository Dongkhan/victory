"""러닝퀘스트(Run Quest) v0.1 MVP 회귀 테스트.

저장소의 다른 프로토타입과 같은 방식으로, 단일 HTML 산출물의 구조/안전/접근성
계약을 텍스트 수준에서 고정한다.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "run-quest" / "prototype" / "v0.1.html"
HTML = APP.read_text(encoding="utf-8")


def test_run_quest_is_a_single_offline_file():
    assert APP.exists(), "최신 실행본이 있어야 한다"
    # 외부 스크립트/스타일/이미지에 의존하지 않는 완전 오프라인 파일
    assert not re.search(r'<script[^>]+src=', HTML)
    assert not re.search(r'<link[^>]+stylesheet', HTML)
    assert "http://" not in HTML
    for host in ("cdn.", "googleapis", "unpkg", "jsdelivr"):
        assert host not in HTML


def test_project_is_reachable_from_root_index_and_folder_index():
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    assert "run-quest/prototype/v0.1.html" in index
    assert "러닝퀘스트" in index

    folder_index = (ROOT / "run-quest" / "index.html").read_text(encoding="utf-8")
    assert "./prototype/v0.1.html" in folder_index


def test_short_urls_redirect_to_latest_build():
    cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    targets = {
        r["source"]: r["destination"]
        for r in cfg["redirects"]
        if r["destination"].startswith("/run-quest/")
    }
    assert targets.get("/run") == "/run-quest/prototype/v0.1.html"
    assert targets.get("/run-quest") == "/run-quest/prototype/v0.1.html"


def test_three_run_modes_and_goal_options_exist():
    for mode in ("free", "story", "interval"):
        assert 'data-mode="{}"'.format(mode) in HTML
    for goal in ("none", "d2", "d5", "t20", "t30"):
        assert 'data-goal="{}"'.format(goal) in HTML
    assert "intervalPlan" in HTML and "쿨다운" in HTML


def test_tracking_uses_device_geolocation_with_haversine_distance():
    assert "watchPosition" in HTML
    assert "clearWatch" in HTML
    assert "function haversine" in HTML
    assert "enableHighAccuracy:true" in HTML
    # 위치 데이터는 어디에도 전송하지 않는다
    for sink in ("fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon"):
        assert sink not in HTML


def test_missing_location_permission_falls_back_to_demo_mode():
    assert "fallbackToDemo" in HTML
    assert "위치 권한이 없어 데모 모드로 이어갑니다." in HTML
    assert "startSim" in HTML


def test_gamification_layer_is_wired():
    assert "QUEST_POOL" in HTML and "ensureQuests" in HTML and "refreshQuests" in HTML
    assert "function grantBadge" in HTML and "evaluateBadges" in HTML
    assert "function levelInfo" in HTML and "bumpStreak" in HTML
    # 배지는 16종, 데일리 퀘스트는 매일 3개 고정
    badges_block = re.search(r"var BADGES = \[(.*?)\n\];", HTML, re.S).group(1)
    assert len(re.findall(r'\{id:"', badges_block)) == 16
    quest_block = re.search(r"var QUEST_POOL = \[(.*?)\n\];", HTML, re.S).group(1)
    assert len(re.findall(r'\{id:"', quest_block)) == 8
    assert "picked.length < 3" in HTML


def test_session_records_persist_locally_only():
    assert 'var KEY = "runquest.v1";' in HTML
    assert "localStorage.setItem(KEY" in HTML
    assert "localStorage.removeItem(KEY)" in HTML  # 전체 삭제
    assert "runquest-" in HTML and "application/json" in HTML  # 내보내기
    assert "downsample" in HTML  # 경로 좌표는 축약 저장


def test_too_short_sessions_are_not_saved():
    assert "r.movingMs < 15000 || r.distanceM < 50" in HTML
    assert "기록이 너무 짧아 저장하지 않았어요." in HTML


def test_safety_notices_are_present_on_first_screen_and_settings():
    assert HTML.count('class="safety"') >= 3
    assert "의료기기가 아니며" in HTML
    assert "119" in HTML
    assert "가슴 통증" in HTML
    assert "차도·신호를 항상 먼저 보세요" in HTML


def test_accessibility_contracts():
    assert "prefers-reduced-motion" in HTML
    assert 'data-opt="reduceMotion"' in HTML
    assert ":focus-visible" in HTML
    assert "outline:none" not in HTML
    assert "--tap:44px" in HTML
    assert 'role="tablist"' in HTML and 'aria-selected="true"' in HTML
    assert HTML.count('role="switch"') == 5
    assert 'aria-live="polite"' in HTML and 'aria-live="assertive"' in HTML
    assert 'role="dialog"' in HTML and 'aria-modal="true"' in HTML


def test_run_controls_require_deliberate_stop_and_support_pause():
    assert "길게 눌러 종료" in HTML
    assert "HOLD=900" in HTML
    assert "function pauseRun" in HTML and "function resumeRun" in HTML
    assert "S.profile.autoPause" in HTML  # 자동 일시정지


def test_no_ads_or_tracking_or_payment_hooks():
    lowered = HTML.lower()
    for banned in ("gtag", "analytics", "adsbygoogle", "facebook", "iap", "purchase"):
        assert banned not in lowered
