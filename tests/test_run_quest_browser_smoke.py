"""러닝퀘스트 최신본을 실제 Chromium에서 끝까지 돌려보는 스모크 테스트.

정적 문자열 검사로는 잡히지 않는 회귀(레이아웃 겹침, 런타임 예외, 저장·이관 오류)를 막는다.
RUNQUEST_BROWSER=1 일 때만 실행되고, playwright가 없으면 건너뛴다.
로컬에서 크로미움 경로를 지정하려면 RUNQUEST_CHROMIUM=/path/to/chrome 를 준다.
"""

import json
import os
import pathlib
import subprocess

import pytest

playwright = pytest.importorskip("playwright.sync_api")
if not os.environ.get("RUNQUEST_BROWSER"):
    pytest.skip("RUNQUEST_BROWSER=1 일 때만 실행", allow_module_level=True)

ROOT = pathlib.Path(__file__).resolve().parents[1]
LATEST = ROOT / "run-quest" / "prototype" / "v0.5.html"
URL = LATEST.as_uri()


def _launch(p):
    path = os.environ.get("RUNQUEST_CHROMIUM")
    return p.chromium.launch(executable_path=path) if path else p.chromium.launch()


def _hold_stop(pg):
    box = pg.locator("#btnStop").bounding_box()
    pg.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    pg.mouse.down(); pg.wait_for_timeout(1300); pg.mouse.up(); pg.wait_for_timeout(1500)


def test_full_flow_in_chromium(tmp_path):
    errors = []
    with playwright.sync_playwright() as p:
        b = _launch(p)
        ctx = b.new_context(viewport={"width": 390, "height": 844}, color_scheme="dark")
        pg = ctx.new_page()
        pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
        pg.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
        pg.on("dialog", lambda d: d.accept("테스트 동네"))
        pg.goto(URL); pg.wait_for_timeout(400)

        # 온보딩 → 원버튼 시작(데모 설정을 기억)
        assert pg.is_visible("#onboard")
        pg.fill("#obName", "테스터"); pg.click("#obStart"); pg.wait_for_timeout(300)
        pg.click('#tabbar button[data-tab="run"]'); pg.click("#btnDemo")
        pg.click('#tabbar button[data-tab="home"]'); pg.wait_for_timeout(200)
        assert "데모" in pg.inner_text("#quickHint")
        pg.click("#quickStart"); pg.wait_for_timeout(1500)
        assert pg.is_visible("#live"), "원버튼으로 바로 시작돼야 한다"

        # 데모 시뮬레이터로 잠깐 달리고, 훅으로 보물·재방문·이관 규칙을 확인
        pg.wait_for_timeout(18000)
        st = pg.evaluate("""() => { const r = RunQuest._run(); return {
            cells: r.newCells, dist: Math.round(r.distanceM), treasures: r.treasures.length,
            fp: r.fp.reduce((a,x)=>a+x,0) > 0 }; }""")
        assert st["cells"] >= 1 and st["dist"] > 10, st
        assert st["fp"], "코스 지문이 쌓여야 한다"
        got = pg.evaluate("""() => { const r = RunQuest._run();
            if(!r.treasures.length) return {skipped:true};
            const before = r.treasuresGot; RunQuest._paint(r.treasures[0].key);
            return { before, after: r.treasuresGot }; }""")
        assert got.get("skipped") or got["after"] == got["before"] + 1, got
        _hold_stop(pg)
        assert pg.is_visible("#modal"), "완료 요약이 떠야 한다"
        assert pg.locator("#btnSavePlace").count() == 1
        pg.click("#btnSavePlace"); pg.wait_for_timeout(600)
        pg.click("#btnCloseSheet"); pg.wait_for_timeout(400)
        assert pg.evaluate("RunQuest.state().places.length") == 1

        # 사진 핀
        photo = tmp_path / "p.jpg"
        subprocess.run(["python3", "-c",
            "from PIL import Image;Image.new('RGB',(600,800),(40,90,70)).save('%s')" % photo], check=True)
        pg.click('#tabbar button[data-tab="log"]'); pg.wait_for_timeout(300)
        pg.click("#histList .item"); pg.wait_for_timeout(500)
        pg.click(".photoadd"); pg.set_input_files("#photoInput", str(photo)); pg.wait_for_timeout(1500)
        assert pg.evaluate("Object.values(RunQuest.state().photos)[0].lat") is not None
        pg.click("#btnCloseSheet"); pg.wait_for_timeout(300)

        # 내보내기 파일 → 가져오기(합치기)
        exported = pg.evaluate("JSON.stringify(RunQuest.state())")
        inc = json.loads(exported)
        inc["sessions"][0]["id"] = "other-phone-1"       # 다른 폰의 기록처럼
        inc["map"]["cells"] = {"7777,7777": 20260701003, **inc["map"]["cells"]}
        merged = pg.evaluate("""(txt) => { const inc = RunQuest.normalizeImport(JSON.parse(txt));
            const before = RunQuest.globalStats().total;
            const added = RunQuest.mergeInto(RunQuest.state(), inc);
            return { added, after: RunQuest.globalStats().total, before }; }""", json.dumps(inc))
        assert merged["added"]["sessions"] == 1 and merged["after"] == merged["before"] + 1, merged

        # 저장·재시작 후 유지 + 용량 표시
        pg.reload(); pg.wait_for_timeout(700)
        assert not pg.is_visible("#onboard")
        pg.click('#tabbar button[data-tab="me"]'); pg.wait_for_timeout(200)
        assert "사용 중" in pg.inner_text("#storageInfo")
        b.close()
    assert not errors, errors
