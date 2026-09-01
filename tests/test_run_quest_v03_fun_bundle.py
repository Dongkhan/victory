"""러닝퀘스트 v0.3 — 보물·시즌 색·사진 핀·실황 멘트·지난번 나(고스트) 회귀 테스트."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "run-quest" / "prototype" / "v0.3.html"
HTML = APP.read_text(encoding="utf-8")


def test_v03_build_is_offline_and_dependency_free():
    assert not re.search(r"<script[^>]+src=", HTML)
    assert not re.search(r"<link[^>]+stylesheet", HTML)
    assert "http://" not in HTML
    for host in ("cdn.", "googleapis", "unpkg", "jsdelivr", "overpass", "openstreetmap"):
        assert host not in HTML
    for sink in ("fetch(", "XMLHttpRequest", "WebSocket", "navigator.sendBeacon"):
        assert sink not in HTML


def test_v03_stays_available_as_the_previous_build():
    """v0.3은 보존 대상. 최신본 링크는 v0.4 테스트가 검증한다."""
    cfg = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
    sources = {r["source"] for r in cfg["redirects"]}
    assert "/run-quest/prototype/v0.3.html" in sources


# ── ① 보물 사냥 ────────────────────────────────────────────
def test_treasures_only_spawn_next_to_cells_you_have_walked():
    """가본 길에 붙은 칸에만 놓아 실제로 갈 수 있는 곳만 가리킨다."""
    spawn = HTML[HTML.index("function spawnTreasure"):HTML.index("function refillTreasures")]
    assert "if(S.map.cells[key] || taken[key]) continue;" in spawn      # 이미 칠한 칸엔 안 놓음
    assert 'var near = S.map.cells[(i+1)+","+j]' in spawn               # 4-이웃 중 하나는 밟은 칸
    assert "var pool = edge.length ? edge : any;" in spawn
    assert "TREASURE_MIN_M" in spawn and "TREASURE_MAX_M" in spawn      # 거리 범위
    assert "TREASURE_APART_M" in HTML                                   # 보물끼리 최소 간격
    assert "var TREASURE_MAX = 3" in HTML


def test_treasure_pickup_is_tied_to_painting_that_cell():
    paint = HTML[HTML.index("function paintCell(key){"):HTML.index("function onDistance()")]
    assert "if(run.treasures[ti].key !== key) continue;" in paint
    assert "run.treasuresGot++;" in paint
    assert "refillTreasures();" in paint
    assert "(r.treasureXp||0)" in HTML                                   # XP에 반영
    assert 'data-opt="treasures"' in HTML                                # 끌 수 있다


# ── ② 시즌 색 ──────────────────────────────────────────────
def test_season_layer_repaints_without_touching_the_record():
    """이번 달 방문은 따로 세고, 첫 개척일은 절대 덮어쓰지 않는다."""
    assert "function seasonSet()" in HTML
    assert "if(!S.map.season || S.map.season.m !== monthNum()) S.map.season = { m: monthNum(), k: {} };" in HTML
    paint = HTML[HTML.index("function paintCell(key){"):HTML.index("function onDistance()")]
    assert "if(S.map.cells[key]){" in paint and "if(!season[key]){" in paint
    assert "S.map.cells[key] = dateNum();" in paint
    # 재방문은 새 칸으로 세지 않는다
    idx_repaint = paint.index("run.repaint")
    idx_new = paint.index("run.newCells++")
    assert idx_repaint < idx_new, "재방문 분기는 newCells 증가 전에 끝나야 한다"
    assert "function cellColor(day, key, today, season, t)" in HTML
    assert "이번 달 칠한 칸" in HTML


# ── ③ 사진 핀 ──────────────────────────────────────────────
def test_photos_carry_a_spot_and_land_on_the_map():
    assert 'S.photos[photoTarget] = { data: c.toDataURL("image/jpeg", 0.6),' in HTML
    draw = HTML[HTML.index("function drawMap(canvas, opt){"):HTML.index("/** 개척 범위에 맞춘 보기 반경")]
    assert "canvas._pins = pins;" in draw
    assert 'ctx.fillText("📷"' in draw
    assert '$("#mapCanvas").addEventListener("click"' in HTML          # 핀 탭 → 그날 기록
    # 옛 문자열 사진도 좌표를 붙여 이관한다
    assert "function normalizePhotos" in HTML
    norm = HTML[HTML.index("function normalizePhotos"):HTML.index("/** runquest.v3 데이터를")]
    assert 'if(typeof v === "string")' in norm and "out[id] = { data:v," in norm


# ── ④ 실황 멘트 ────────────────────────────────────────────
def test_commentary_is_rate_limited():
    assert "function say(emoji, text, gapMs)" in HTML
    say = HTML[HTML.index("function say(emoji, text, gapMs)"):HTML.index("/* ---------------- 지난번 나")]
    assert "run.movingMs - run.lastSayAt <" in say                      # 최소 간격
    assert "이 골목은 처음이에요!" in HTML
    assert "이번 달 처음 오는 길이에요" in HTML


# ── ⑤ 지난번 나(고스트) ────────────────────────────────────
def test_ghost_is_my_own_past_run_from_the_same_spot():
    find = HTML[HTML.index("function findGhost(start)"):HTML.index("/** 지난번 나와의 거리 차")]
    assert "if(!S.profile.ghost || !start) return null;" in find
    assert "> GHOST_START_R) continue;" in find                          # 같은 자리에서 출발한 것만
    assert "sx.movingMs < 60000 || sx.distanceM < 200" in find           # 너무 짧은 기록은 제외
    tick = HTML[HTML.index("function tickGhost()"):HTML.index("/* ---------------- 보물")]
    assert "g.gap = run.distanceM - g.speed*(run.movingMs/1000);" in tick
    assert "Math.abs(g.gap) < 14" in tick                                # 겹치면 옆으로
    assert 'data-opt="ghost"' in HTML
    assert "ghostGap: r.ghost ? Math.round(r.ghost.gap) : null," in HTML # 요약에 남는다


def test_new_badges_cover_the_new_loops():
    badges = re.search(r"var BADGES = \[(.*?)\n\];", HTML, re.S).group(1)
    assert len(re.findall(r'\{id:"', badges)) == 23
    for bid in ("treasure10", "treasure50", "ghostWin"):
        assert '{id:"'+bid in badges


def test_storage_migrates_from_every_earlier_version():
    assert 'var KEY = "runquest.v4", OLD_KEYS = ["runquest.v3", "runquest.v2", "runquest.v1"];' in HTML
    for fn in ("function migrateV3", "function migrateV2", "function migrateV1"):
        assert fn in HTML, fn
    assert "if(o && o.v === 4) return merge(o);" in HTML


def test_settings_expose_every_new_loop():
    assert HTML.count('role="switch"') == 8
    for opt in ("treasures", "ghost", "autoStop", "autoPause", "voice", "haptics", "keepAwake", "reduceMotion"):
        assert 'data-opt="{}"'.format(opt) in HTML, opt


def test_safety_and_accessibility_contracts_hold():
    assert HTML.count('class="safety"') >= 3
    assert "의료기기가 아니며" in HTML and "119" in HTML and "가슴 통증" in HTML
    assert "prefers-reduced-motion" in HTML and 'data-opt="reduceMotion"' in HTML
    assert ":focus-visible" in HTML and "outline:none" not in HTML
    assert "--tap:44px" in HTML
    assert 'role="tablist"' in HTML
    assert 'aria-live="polite"' in HTML and 'aria-live="assertive"' in HTML
    assert "[hidden]{display:none !important}" in HTML
    # 보물·고스트는 속도를 강요하지 않는다
    assert "차 없는 넓은 코스에서만" in HTML


def test_no_ads_or_tracking_or_payment_hooks():
    lowered = HTML.lower()
    for banned in ("gtag", "analytics", "adsbygoogle", "facebook", "iap", "purchase"):
        assert banned not in lowered
