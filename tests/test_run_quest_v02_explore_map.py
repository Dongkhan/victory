"""러닝퀘스트 v0.2 — 동네 탐험 지도 회귀 테스트."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "run-quest" / "prototype" / "v0.2.html"
HTML = APP.read_text(encoding="utf-8")


def test_v02_build_is_offline_and_dependency_free():
    assert not re.search(r"<script[^>]+src=", HTML)
    assert not re.search(r"<link[^>]+stylesheet", HTML)
    assert "http://" not in HTML
    for host in ("cdn.", "googleapis", "unpkg", "jsdelivr", "overpass", "openstreetmap"):
        assert host not in HTML
    # 위치·지도 데이터를 내보내는 경로가 없어야 한다
    for sink in ("fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon"):
        assert sink not in HTML


def test_v02_stays_available_as_the_previous_build():
    """v0.2는 보존 대상. 최신본 링크는 v0.2.1 테스트가 검증한다."""
    cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    sources = {r["source"] for r in cfg["redirects"]}
    assert "/run-quest/prototype/v0.2.html" in sources, "구 링크는 최신본으로 넘겨야 한다"


def test_grid_and_zone_geometry():
    assert "var CELL = 40;" in HTML
    assert "var RINGS = [500, 1000, 1500];" in HTML
    assert "ZONE_TARGET = [12, 20, 28]" in HTML
    # 8방위 × 3거리 = 24구역
    assert "return ring*8 + (Math.round(ang/45) % 8);" in HTML
    assert HTML.count('"0/24"') + HTML.count("'/24'") + HTML.count('+"/24"') >= 1
    # 집 앞 마당은 구역이 아니다(제자리 발견 방지)
    assert "if(dist < 80 || dist > HOME_R) return -1;" in HTML
    # 점 사이를 훑어 지나간 칸을 모두 채운다
    assert "function paintSegment" in HTML and "Math.ceil(d/(CELL/2))" in HTML


def test_map_is_drawn_from_home_relative_coordinates_only():
    """지도·기록 카드에 실제 좌표나 주소가 들어가지 않아야 한다."""
    assert "function toLocal" in HTML
    assert "위치 정보는 포함되지 않습니다" in HTML
    assert "상대 좌표" in HTML
    card = HTML[HTML.index("function makeCard"):HTML.index("/* ---------- 화면 켜두기")]
    for leak in ("home.lat", "home.lng", ".latitude", ".longitude"):
        assert leak not in card, leak


def test_home_anchor_is_required_before_running():
    assert "먼저 '동네'에서 우리 동네를 정해 주세요." in HTML
    assert "setHomeGps" in HTML and "setHomeDemo" in HTML
    assert "btnMoveHome" in HTML


def test_modes_put_speed_challenges_behind_a_warning():
    for mode in ("explore", "free", "interval", "story"):
        assert 'data-mode="{}"'.format(mode) in HTML
    assert 'data-mode="explore" aria-pressed="true"' in HTML          # 기본은 탐험
    assert "도전 모드" in HTML
    story = HTML[HTML.index('data-mode="story"'):HTML.index("</button>", HTML.index('data-mode="story"'))]
    assert "속도를 올리게" in story and "차 없는 넓은 코스에서만" in story


def test_achievements_are_reworked_for_beginners():
    # 주 단위 스트릭 + 한 주 보호
    assert "function weekStreak" in HTML
    assert ">= 2;" in HTML and "usedProtection" in HTML
    assert "주 2회만 나가면" in HTML
    # 걷기도 인정 — 아주 짧은 기록만 제외
    assert "r.movingMs < 15000 || (r.distanceM < 50 && r.newCells === 0)" in HTML
    assert "걷기도 탐험이에요" in HTML
    # 이야기 배지
    badges = re.search(r"var BADGES = \[(.*?)\n\];", HTML, re.S).group(1)
    assert len(re.findall(r'\{id:"', badges)) == 20
    for story_badge in ("comeback", "allDirs", "zone1", "photo5"):
        assert '{id:"'+story_badge in badges


def test_missions_are_map_aware():
    assert "function buildQuests" in HTML and "weakestDir()" in HTML
    pool = HTML[HTML.index("var pool = ["):HTML.index("/* 첫날/지도 없음이면")]
    for kind in ('kind:"cells"', 'kind:"dir"', 'kind:"zone"', 'kind:"far"', 'kind:"photo"'):
        assert kind in pool
    assert "picked.length < 3" in HTML


def test_evidence_of_the_day_is_local_only():
    assert 'id="photoInput"' in HTML and 'accept="image/*"' in HTML
    assert 'toDataURL("image/jpeg", 0.6)' in HTML          # 축소 저장
    assert "while(keys.length > 20)" in HTML               # 보관 개수 제한
    assert "function makeCard" in HTML and "c.toBlob(" in HTML


def test_state_migrates_v1_records_without_loss():
    assert 'var KEY = "runquest.v2", OLD_KEY = "runquest.v1";' in HTML
    assert "function migrateV1" in HTML
    mig = HTML[HTML.index("function migrateV1"):HTML.index("var saveTimer")]
    for kept in ("base.sessions", "base.badges", "base.profile.xp", "base.seenOnboard"):
        assert kept in mig, kept


def test_safety_and_accessibility_contracts_hold():
    assert HTML.count('class="safety"') >= 3
    assert "의료기기가 아니며" in HTML and "119" in HTML and "가슴 통증" in HTML
    assert "prefers-reduced-motion" in HTML
    assert 'data-opt="reduceMotion"' in HTML
    assert ":focus-visible" in HTML and "outline:none" not in HTML
    assert "--tap:44px" in HTML
    assert 'role="tablist"' in HTML and HTML.count('role="switch"') == 5
    assert 'aria-live="polite"' in HTML and 'aria-live="assertive"' in HTML
    assert "[hidden]{display:none !important}" in HTML     # hidden 토글이 CSS에 지지 않도록


def test_no_ads_or_tracking_or_payment_hooks():
    lowered = HTML.lower()
    for banned in ("gtag", "analytics", "adsbygoogle", "facebook", "iap", "purchase"):
        assert banned not in lowered
