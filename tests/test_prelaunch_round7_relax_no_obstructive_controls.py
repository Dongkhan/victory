from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


def test_relax_v13_removes_obstructive_export_reset_shell():
    html = read("relax-routine/prototype/v1.3.html")
    index = read("relax-routine/index.html")

    assert "Relax Routine v1.3" in html
    assert "relax-routine-v13-mobile-state" in html
    assert "relax-start-today-v13" in html
    assert "relax-mobile-release-shell" not in html
    assert "relax-mobile-release-shell-ui" not in html
    assert "relax-export" not in html
    assert "relax-reset" not in html
    assert "function startFocusedSession" in html
    assert "prototype/v1.3.html" in index
