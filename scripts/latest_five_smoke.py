#!/usr/bin/env python3
"""Static smoke runner for the five latest Victory product prototypes.

This is intentionally dependency-free so it can run in CI or on a clinic laptop
before opening the prototypes in a real browser. It checks that the latest entry
points expose explicit state hooks and fail-closed safety markers.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TARGETS = {
    "rr": "relax-routine/prototype/v3.0.html",
    "ba": "behavioral-activation/prototype/v2.8.html",
    "cbti": "cbti-care/prototype/v2.272.html",
    "dfc": "family-link-coach/index.html",
    "dht2": "DH-TALK_V2/app/src/App.tsx",
}

REQUIRED = {
    "rr": ["dataset.app='relax-routine'", "start-pmr", "pmr-v3"],
    "ba": ["dataset.app='behavioral-activation'", "crisisBlocked", "진료 공유 리포트"],
    "cbti": ["dataset.app='cbti-care'", "srtSafe", "SRT 안전 게이트"],
    "dfc": ["dataset.app='digital-family-coach'", "hasCrisisLock", "data-privacy-scope"],
    "dht2": ["syncError", "data-sync-error", "마지막 호출 재시도"],
}


def main() -> int:
    failures = []
    for name, rel in TARGETS.items():
        text = (ROOT / rel).read_text(encoding="utf-8")
        if rel.endswith(".html"):
            buttons = len(re.findall(r"<button\b", text, re.I))
            typed = len(re.findall(r"<button\b[^>]*\btype=", text, re.I))
            if buttons != typed:
                failures.append(f"{name}: button type mismatch {typed}/{buttons}")
        for needle in REQUIRED[name]:
            if needle not in text:
                failures.append(f"{name}: missing {needle}")
    if failures:
        print("latest five smoke failed")
        for failure in failures:
            print("-", failure)
        return 1
    print("latest five smoke passed")
    for name, rel in TARGETS.items():
        print(f"- {name}: {rel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
