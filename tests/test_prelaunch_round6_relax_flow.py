from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_relax_v12_today_session_cta_enters_session_without_overlay_trap():
    html = read("relax-routine/prototype/v1.2.html")
    index = read("relax-routine/index.html")

    assert "Relax Routine v1.2" in html
    assert "relax-routine-v12-mobile-state" in html
    assert "relax-start-today-v12" in html
    assert html.count("id=\"relax-start-today-v12\"") == 1
    assert "relax-simple-home-v11" not in html
    assert "function startFocusedSession" in html
    assert "activeSession: true" in html
    assert "panel.remove()" in html
    assert "window.recordRoutineProgress?.(label)" in html
    assert "scrollIntoView" in html
    assert "prototype/v1.2.html" in index
