from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_project_folders_are_visible_from_root_index():
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    for folder in ["relax-routine/", "cbti-care/", "behavioral-activation/", "dh-talk/"]:
        assert folder in index


def test_mobile_projects_have_separate_latest_indexes():
    expected = {
        "relax-routine": "prototype/v0.6.html",
        "cbti-care": "prototype/v0.6.html",
        "behavioral-activation": "prototype/v0.3.html",
    }
    for folder, latest in expected.items():
        project_dir = ROOT / folder
        assert project_dir.exists(), f"{folder} folder must exist"
        index = (project_dir / "index.html").read_text(encoding="utf-8")
        assert latest in index


def test_dhtalk_has_lan_shared_key_auth_and_electron_fallback():
    server = (ROOT / "dh-talk" / "src" / "main" / "server.js").read_text(encoding="utf-8")
    app = (ROOT / "dh-talk" / "src" / "renderer" / "App.jsx").read_text(encoding="utf-8")
    settings = (ROOT / "dh-talk" / "dh-talk" / "config" / "settings.yaml") if False else (ROOT / "dh-talk" / "config" / "settings.yaml")
    settings_text = settings.read_text(encoding="utf-8")

    assert "authToken" in server
    assert "auth_failed" in server
    assert "allowedUsers" in server
    assert "sender = socket.userId" in server
    assert "client.isAuthed" in server
    assert "token: sharedKey" in app
    assert "ElectronOnlyFallback" in app
    assert "shared_key" in settings_text
