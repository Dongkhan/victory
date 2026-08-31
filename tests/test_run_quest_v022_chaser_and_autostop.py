"""러닝퀘스트 v0.2.2 — 지도 위 추격자와 무동작 자동 종료 회귀 테스트."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "run-quest" / "prototype" / "v0.2.2.html"
HTML = APP.read_text(encoding="utf-8")


def test_v022_build_is_offline_and_dependency_free():
    assert not re.search(r"<script[^>]+src=", HTML)
    assert not re.search(r"<link[^>]+stylesheet", HTML)
    assert "http://" not in HTML
    for host in ("cdn.", "googleapis", "unpkg", "jsdelivr", "overpass", "openstreetmap"):
        assert host not in HTML
    for sink in ("fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon"):
        assert sink not in HTML


def test_v022_stays_available_as_the_previous_build():
    """v0.2.2는 보존 대상. 최신본 링크는 v0.3 테스트가 검증한다."""
    cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    sources = {r["source"] for r in cfg["redirects"]}
    assert "/run-quest/prototype/v0.2.2.html" in sources


def test_chaser_follows_my_own_track():
    """추격자는 내가 지나온 경로를 따라오고, 간격은 내 이동거리로 결정된다."""
    assert "function pointBack(meters)" in HTML
    assert "function tickChaser()" in HTML
    tick = HTML[HTML.index("function tickChaser()"):HTML.index("function tickChallenge()")]
    assert "ch.gap = ch.lead + mine - ch.speed*elapsed;" in tick
    assert "ch.pos = pointBack(Math.max(0, ch.gap));" in tick
    assert "return ch.gap <= 0;" in tick            # 간격이 0이면 잡힘


def test_chaser_is_drawn_on_the_map_with_distance():
    draw = HTML[HTML.index("function drawMap(canvas, opt){"):HTML.index("/** 개척 범위에 맞춘 보기 반경")]
    assert "opt.chaser" in draw and "opt.chaser.pos" in draw
    assert "ctx.fillText(opt.chaser.emoji" in draw
    assert 'Math.max(0, Math.round(opt.chaser.gap))+"m"' in draw   # 남은 거리 라벨
    assert "opt.danger" in draw                                    # 바짝 쫓기면 붉은 테두리
    # 달리는 중 지도가 추격자를 화면 안에 잡아둔다
    assert "if(chaser && chaser.pos) far = Math.max(far, haversine(chaser.pos, me) + 50);" in HTML
    assert ".challenge.near{" in HTML


def test_chase_verdict_matches_the_visible_gap():
    """화면에 보이는 간격이 곧 판정 — 안 잡혔으면 따돌린 것."""
    end = HTML[HTML.index("function endChallenge(caught){"):HTML.index("/* ---------- 인터벌 ---------- */")]
    assert "var escaped = chaser ? !caught : (run.distanceM - ch.startDist >= ch.needM*0.92);" in end
    assert "run.chasesCaught++;" in end
    assert "잡혔어요!" in end and "따돌렸어요!" in end
    # 잡혀도 벌점은 없다 — 안전이 우선
    assert "run.profile" not in end and "-=" not in end


def test_chaser_only_appears_in_story_mode():
    start = HTML[HTML.index("function startChase(){"):HTML.index("/** 내 경로를 따라 meters")]
    assert "run.chaser = {" in start
    for other in ("function startFormTip()", "function advancePlan()"):
        block = HTML[HTML.index(other):HTML.index(other) + 900]
        assert "run.chaser" not in block, other


def test_run_auto_stops_after_five_idle_minutes():
    assert "var AUTO_STOP_MS = 5*60*1000;" in HTML
    assert "var AUTO_STOP_WARN_MS = 4*60*1000;" in HTML
    tick = HTML[HTML.index("function tick(){"):HTML.index("function updateLive(){")]
    assert "if(S.profile.autoStop){" in tick
    assert "if(idle >= AUTO_STOP_MS){ finishRun(true); return; }" in tick
    assert "1분 뒤 자동으로 종료할게요." in tick
    # 실제 시각 기준이라 일시정지 중에도, GPS가 없어도 흐른다
    assert "lastMoveAt: Date.now()" in HTML
    assert "run.lastMoveAt = Date.now();" in HTML
    assert "var idle = now - run.lastMoveAt;" in tick


def test_auto_stop_is_a_user_setting_and_saves_the_run():
    assert 'data-opt="autoStop"' in HTML
    assert "autoStop:true" in HTML                                   # 기본 켜짐
    assert "5분 동안 움직임이 없으면 알아서 종료하고 저장해요." in HTML
    assert '"5분 동안 움직임이 없어 자동으로 종료했어요."' in HTML
    assert HTML.count('role="switch"') == 6


def test_story_mode_still_carries_its_safety_warning():
    story = HTML[HTML.index('data-mode="story"'):HTML.index("</button>", HTML.index('data-mode="story"'))]
    assert "지도 위에서 내 경로를" in story
    assert "차 없는 넓은 코스에서만" in story
    assert "도전 모드" in HTML
    assert 'data-mode="explore" aria-pressed="true"' in HTML          # 기본은 여전히 탐험


def test_safety_and_accessibility_contracts_hold():
    assert HTML.count('class="safety"') >= 3
    assert "의료기기가 아니며" in HTML and "119" in HTML and "가슴 통증" in HTML
    assert "prefers-reduced-motion" in HTML and 'data-opt="reduceMotion"' in HTML
    assert ":focus-visible" in HTML and "outline:none" not in HTML
    assert "--tap:44px" in HTML
    assert 'role="tablist"' in HTML
    assert 'aria-live="polite"' in HTML and 'aria-live="assertive"' in HTML
    assert "[hidden]{display:none !important}" in HTML


def test_no_ads_or_tracking_or_payment_hooks():
    lowered = HTML.lower()
    for banned in ("gtag", "analytics", "adsbygoogle", "facebook", "iap", "purchase"):
        assert banned not in lowered
