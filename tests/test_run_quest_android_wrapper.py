"""러닝퀘스트 안드로이드(Capacitor) 래퍼 회귀 테스트."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "run-quest" / "capacitor-app"
ANDROID = APP / "android"
MANIFEST = (ANDROID / "app/src/main/AndroidManifest.xml").read_text(encoding="utf-8")
WORKFLOW = (ROOT / ".github/workflows/run-quest-android.yml").read_text(encoding="utf-8")


def test_web_asset_matches_the_prototype_exactly():
    """www/index.html 은 최신 실행본의 사본이어야 한다(수동 편집으로 갈라지지 않게)."""
    proto = (ROOT / "run-quest/prototype/v0.2.2.html").read_text(encoding="utf-8")
    packed = (APP / "www/index.html").read_text(encoding="utf-8")
    assert packed == proto
    pkg = json.loads((APP / "package.json").read_text(encoding="utf-8"))
    assert pkg["scripts"]["copy:web"].endswith("v0.2.2.html www/index.html")


def test_capacitor_config_targets_the_bundled_web_dir():
    cfg = json.loads((APP / "capacitor.config.json").read_text(encoding="utf-8"))
    assert cfg["appId"] == "com.dongkhan.runquest"
    assert cfg["webDir"] == "www"
    assert cfg["server"]["androidScheme"] == "https"


def test_manifest_declares_only_the_permissions_the_app_uses():
    declared = set(re.findall(r'uses-permission android:name="android\.permission\.([A-Z_]+)"', MANIFEST))
    assert declared == {"INTERNET", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION", "VIBRATE"}
    # GPS가 없는 기기도 설치 가능해야 한다(앱은 데모 모드로 동작)
    assert 'android:name="android.hardware.location.gps" android:required="false"' in MANIFEST


def test_app_identity_and_version():
    gradle = (ANDROID / "app/build.gradle").read_text(encoding="utf-8")
    assert 'applicationId "com.dongkhan.runquest"' in gradle
    assert 'versionName "0.2.2"' in gradle
    assert "versionCode 4" in gradle
    strings = (ANDROID / "app/src/main/res/values/strings.xml").read_text(encoding="utf-8")
    assert "러닝퀘스트" in strings


def test_launcher_icons_exist_for_every_density():
    for dpi in ("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"):
        d = ANDROID / "app/src/main/res" / ("mipmap-" + dpi)
        for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            f = d / name
            assert f.exists() and f.stat().st_size > 0, f
    bg = (ANDROID / "app/src/main/res/values/ic_launcher_background.xml").read_text(encoding="utf-8")
    assert "#0D9488" in bg


def test_ci_workflow_builds_and_publishes_the_apk():
    assert "assembleDebug" in WORKFLOW
    assert "actions/upload-artifact" in WORKFLOW
    assert "gh release upload" in WORKFLOW
    assert "platforms;android-36" in WORKFLOW
    assert 'java-version: "21"' in WORKFLOW
    assert "contents: write" in WORKFLOW  # 릴리스 자산 업로드에 필요


def test_node_modules_are_not_committed():
    gitignore = (ROOT / ".gitignore").read_text(encoding="utf-8")
    assert "run-quest/capacitor-app/node_modules/" in gitignore
