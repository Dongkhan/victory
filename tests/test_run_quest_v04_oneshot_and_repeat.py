"""러닝퀘스트 v0.4 — 원버튼 시작과 '반복해도 쌓이는' 보상 회귀 테스트."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "run-quest" / "prototype" / "v0.4.html"
HTML = APP.read_text(encoding="utf-8")


def test_v04_build_is_offline_and_dependency_free():
    assert not re.search(r"<script[^>]+src=", HTML)
    assert not re.search(r"<link[^>]+stylesheet", HTML)
    assert "http://" not in HTML
    for host in ("cdn.", "googleapis", "unpkg", "jsdelivr", "overpass", "openstreetmap"):
        assert host not in HTML
    for sink in ("fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon"):
        assert sink not in HTML


def test_v04_stays_available_as_the_previous_build():
    """v0.4는 보존 대상. 최신본 링크는 v0.5 테스트가 검증한다."""
    cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    sources = {r["source"] for r in cfg["redirects"]}
    assert "/run-quest/prototype/v0.4.html" in sources


# ── 원버튼 시작 ────────────────────────────────────────────
def test_first_screen_starts_a_run_with_one_button():
    assert 'id="quickStart"' in HTML
    assert '$("#quickStart").addEventListener("click", function(){ startRun(); });' in HTML
    # 준비 화면은 남아 있지만 선택 사항
    assert 'id="goRun"' in HTML and "모드·목표 고르고 시작" in HTML
    # 시작 게이트가 다시 생기지 않았는지
    assert "먼저 '동네'에서 우리 동네를 정해 주세요." not in HTML


def test_last_setup_is_remembered_for_the_one_button():
    assert "function rememberPrep()" in HTML
    assert "S.profile.lastPrep = { mode:prep.mode, goal:prep.goal, demo:prep.demo };" in HTML
    assert "var prep = Object.assign({ mode:\"explore\", goal:\"none\", demo:false }, S.profile.lastPrep || {});" in HTML
    assert "function syncPrepUI()" in HTML          # 저장된 설정이 준비 화면에도 반영
    assert 'id="quickHint"' in HTML                 # 무엇으로 시작하는지 미리 보여준다


# ── 길 닳기 (반복 보상 ①) ─────────────────────────────────
def test_cells_remember_how_often_you_ran_them():
    assert "function firstDay(v){ return Math.floor(v/1000); }" in HTML
    assert "function visitsOf(v){ return v % 1000; }" in HTML
    assert "function packCell(day, visits)" in HTML
    paint = HTML[HTML.index("function paintCell(key){"):HTML.index("function onDistance()")]
    assert "S.map.cells[key] = packCell(firstDay(prev), was + 1);" in paint    # 재방문마다 +1
    assert "run.familiar++;" in paint
    assert "run.wearGain +=" in paint
    # 한 번의 달리기에서 같은 칸은 한 번만 (제자리 반복으로 부풀릴 수 없다)
    assert "if(run.cellSeen[key]) return;" in paint
    # 첫 개척일은 보존
    assert "packCell(firstDay(prev)" in paint


def test_worn_trails_are_visible_and_rewarded():
    assert "function wearLevel(n){ return clamp((n-1)/14, 0, 1); }" in HTML
    assert "var w = wearLevel(visitsOf(v));" in HTML                # 지도 색이 밝아진다
    assert "Math.round((r.wearGain||0)*8)" in HTML                  # XP에 반영
    assert 'id="totWorn"' in HTML and "10번 이상 다닌 칸" in HTML
    assert "이 길, 열 번째예요" in HTML                              # 실황 멘트


# ── 코스 기록 (반복 보상 ②) ───────────────────────────────
def test_repeated_runs_group_into_a_named_route():
    assert "function matchRoute(startLat, startLng, distanceM)" in HTML
    match = HTML[HTML.index("function matchRoute"):HTML.index("/** 세션을 코스에 반영")]
    assert "> ROUTE_START_R) continue;" in match                     # 같은 출발점
    assert "Math.max(300, r.dist*0.18)" in match                     # 비슷한 거리
    assert "function recordRoute(session)" in HTML
    rec = HTML[HTML.index("function recordRoute(session)"):HTML.index("function routeName(r)")]
    assert "if(session.startLat == null || session.distanceM < 400) return null;" in rec
    assert "r.runs++;" in rec
    assert "session.routeRuns = r.runs;" in rec
    assert 'id="routeList"' in HTML and "data-rename-route" in HTML   # 이름을 붙일 수 있다


def test_route_levels_grow_with_repetition():
    levels = HTML[HTML.index("var ROUTE_LEVELS = ["):HTML.index("function routeLevel(runs)")]
    for n, title in ((1, "새 코스"), (3, "익숙한 코스"), (10, "단골 코스"), (30, "내 코스"), (100, "전설의 코스")):
        assert '{n:'+str(n) in levels and title in levels
    assert "function routeBlock(s)" in HTML                           # 완료 화면에 코스 진행
    assert "번째 완주" in HTML
    assert "번 더 하면 " in HTML


def test_personal_best_on_a_familiar_route_is_celebrated():
    rec = HTML[HTML.index("function recordRoute(session)"):HTML.index("function routeName(r)")]
    assert "var isPR = beforeBest == null || pace < beforeBest - 0.5;" in rec   # 0.5초 여유로 노이즈 방지
    assert "session.routePR = isPR && beforeRuns > 0;" in rec                   # 첫 완주는 PR 아님
    assert "이 코스 자체 최고 기록!" in HTML
    assert "km당 " in HTML and "초 단축" in HTML
    # 고스트는 최근 세 번 중 가장 빨랐던 나
    find = HTML[HTML.index("function findGhost(start)"):HTML.index("/** 지난번 나와의 거리 차")]
    assert "cands.length<3" in find and "best.distanceM/best.movingMs" in find


def test_summary_shows_how_much_was_familiar():
    block = HTML[HTML.index("function routeBlock(s)"):HTML.index("function showSummary(s, extra)")]
    assert "익숙한 길" in block and "다시 밟은 칸" in block
    assert "famPct" in block


def test_new_badges_cover_repetition():
    badges = re.search(r"var BADGES = \[(.*?)\n\];", HTML, re.S).group(1)
    assert len(re.findall(r'\{id:"', badges)) == 27
    for bid in ("route10", "route30", "routePR", "worn20"):
        assert '{id:"'+bid in badges


def test_storage_migrates_visit_counts_from_v03():
    assert 'var KEY = "runquest.v5", OLD_KEYS = ["runquest.v4", "runquest.v3", "runquest.v2", "runquest.v1"];' in HTML
    assert "function migrateV4" in HTML
    mig = HTML[HTML.index("function migrateV4"):HTML.index("/** runquest.v3 데이터 — 칸 값은 날짜뿐")]
    assert "packed[k] = v > 99999999 ? v : packCell(v, 1);" in mig    # 이미 방문 수가 있으면 그대로
    assert "if(o && o.v === 5) return merge(o);" in HTML


def test_safety_and_accessibility_contracts_hold():
    assert HTML.count('class="safety"') >= 3
    assert "의료기기가 아니며" in HTML and "119" in HTML and "가슴 통증" in HTML
    assert "prefers-reduced-motion" in HTML and 'data-opt="reduceMotion"' in HTML
    assert ":focus-visible" in HTML and "outline:none" not in HTML
    assert "--tap:44px" in HTML
    assert 'role="tablist"' in HTML and HTML.count('role="switch"') == 8
    assert 'aria-live="polite"' in HTML and 'aria-live="assertive"' in HTML
    assert "[hidden]{display:none !important}" in HTML
    assert "차 없는 넓은 코스에서만" in HTML


def test_no_ads_or_tracking_or_payment_hooks():
    lowered = HTML.lower()
    for banned in ("gtag", "analytics", "adsbygoogle", "facebook", "iap", "purchase"):
        assert banned not in lowered
