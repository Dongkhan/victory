"""러닝퀘스트 v0.2.1 — 어디서 출발해도 되는 탐험 지도 회귀 테스트."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "run-quest" / "prototype" / "v0.2.1.html"
HTML = APP.read_text(encoding="utf-8")


def test_latest_build_is_offline_and_dependency_free():
    assert not re.search(r"<script[^>]+src=", HTML)
    assert not re.search(r"<link[^>]+stylesheet", HTML)
    assert "http://" not in HTML
    for host in ("cdn.", "googleapis", "unpkg", "jsdelivr", "overpass", "openstreetmap"):
        assert host not in HTML
    for sink in ("fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon"):
        assert sink not in HTML


def test_latest_build_is_the_one_linked_everywhere():
    assert "run-quest/prototype/v0.2.1.html" in (ROOT / "index.html").read_text(encoding="utf-8")
    assert "./prototype/v0.2.1.html" in (ROOT / "run-quest/index.html").read_text(encoding="utf-8")
    cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    targets = {r["source"]: r["destination"] for r in cfg["redirects"]}
    for src in ("/run", "/running", "/run-quest",
                "/run-quest/prototype/v0.1.html", "/run-quest/prototype/v0.2.html"):
        assert targets.get(src) == "/run-quest/prototype/v0.2.1.html", src


def test_running_never_requires_a_saved_place():
    """v0.2의 '동네 먼저 정하기' 게이트가 사라져야 한다."""
    assert "먼저 '동네'에서 우리 동네를 정해 주세요." not in HTML
    assert '$("#startRun").addEventListener("click", startRun);' in HTML
    # 출발 지점은 첫 위치 신호에서 스스로 잡는다
    assert "run.origin = { lat:p.lat, lng:p.lng };" in HTML
    assert "paintCell(cellKeyOf(p.lat, p.lng));" in HTML


def test_cells_are_stored_on_a_global_grid():
    """칸 키가 절대 위경도 기반이라 거점을 옮기거나 여행해도 지도가 유지된다."""
    assert "function cellKeyOf(lat, lng)" in HTML
    assert "var LAT_STEP = CELL / M_PER_LAT;" in HTML
    assert "function cellCenterLatLng(key)" in HTML
    # 집 기준 상대 격자(v0.2)의 흔적이 남아 있으면 안 된다
    assert "S.map.home" not in HTML
    assert "function cellOf(x,y)" not in HTML


def test_multiple_places_are_supported():
    assert "S.places" in HTML and "function addPlace" in HTML
    assert "function activePlace" in HTML and "function nearestPlace" in HTML
    assert 'id="placeChips"' in HTML and 'id="placeList"' in HTML
    assert "data-rename" in HTML and "data-delplace" in HTML
    # 거점을 지워도 칠한 지도는 남는다
    assert "칠한 지도와 기록은 그대로 남고" in HTML


def test_finished_run_offers_to_save_a_new_place_only_when_far():
    assert "offerPlace: !!(startPoint && (!near || near.dist > 1200))" in HTML
    assert "여기, 자주 오나요?" in HTML
    assert 'id="btnSavePlace"' in HTML
    # 세션은 출발 좌표와 소속 거점을 남긴다
    assert "startLat: startPoint ? +startPoint.lat.toFixed(5) : null" in HTML
    assert "placeId: (near && near.dist <= PLACE_R) ? near.place.id : null" in HTML


def test_zones_are_computed_per_place():
    assert "function placeStats(place)" in HTML and "function globalStats()" in HTML
    assert "ZONE_TARGET = [12, 20, 28]" in HTML
    assert "if(dist < 80 || dist > PLACE_R) return -1;" in HTML
    # 거점이 없어도 전체 칸 수는 항상 셀 수 있어야 한다
    gs = HTML[HTML.index("function globalStats()"):HTML.index("function placeStats(place)")]
    assert "S.places" not in gs and "activePlace" not in gs


def test_v2_records_and_painted_map_migrate_forward():
    assert 'var KEY = "runquest.v3", OLD_KEYS = ["runquest.v2", "runquest.v1"];' in HTML
    assert "function migrateV2" in HTML and "function migrateV1" in HTML
    mig = HTML[HTML.index("function migrateV2"):HTML.index("/** v0.1 기록을 그대로 이어받는다")]
    # 옛 상대 좌표 칸을 전역 키로 변환해 보존한다
    assert "toLatLng(x, y, home)" in mig and "cellKeyOf(ll.lat, ll.lng)" in mig
    for kept in ("base.sessions", "base.badges", "base.photos", "base.profile"):
        assert kept in mig, kept


def test_shared_card_never_prints_coordinates():
    """기록 카드에 찍히는 글자 중 위경도를 담은 것이 없어야 한다."""
    assert "function toLocal" in HTML
    assert "위치 정보는 포함되지 않습니다" in HTML
    assert "상대 좌표" in HTML
    card = HTML[HTML.index("function makeCard"):HTML.index("/* ---------- 화면 켜두기")]
    printed = re.findall(r"ctx\.fillText\((.*?)\);", card, re.S)
    assert printed, "카드에 그리는 글자가 있어야 한다"
    for text in printed:
        for leak in ("lat", "lng", "latitude", "longitude"):
            assert leak not in text, (leak, text)
    # 지도 자체도 중심점 기준 상대 미터로만 그린다
    draw = HTML[HTML.index("function drawMap(canvas, opt){"):HTML.index("/** 개척 범위에 맞춘 보기 반경")]
    for text in re.findall(r"ctx\.fillText\((.*?)\);", draw, re.S):
        for leak in ("lat", "lng"):
            assert leak not in text, (leak, text)


def test_safety_and_accessibility_contracts_hold():
    assert HTML.count('class="safety"') >= 3
    assert "의료기기가 아니며" in HTML and "119" in HTML and "가슴 통증" in HTML
    assert "prefers-reduced-motion" in HTML and 'data-opt="reduceMotion"' in HTML
    assert ":focus-visible" in HTML and "outline:none" not in HTML
    assert "--tap:44px" in HTML
    assert 'role="tablist"' in HTML and HTML.count('role="switch"') == 5
    assert 'aria-live="polite"' in HTML and 'aria-live="assertive"' in HTML
    assert "[hidden]{display:none !important}" in HTML


def test_no_ads_or_tracking_or_payment_hooks():
    lowered = HTML.lower()
    for banned in ("gtag", "analytics", "adsbygoogle", "facebook", "iap", "purchase"):
        assert banned not in lowered
