#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

REPORT = Path(__file__).resolve().parent / "last_drive_publish_report.json"

def main():
    data = json.loads(REPORT.read_text(encoding="utf-8"))
    repo = data.get("repo", {})
    lines = []
    lines.append("Drive 업로드 완료")
    lines.append(f"루트 폴더: {data['root_folder'].get('webViewLink')}")
    lines.append(f"인덱스: {data['index_file'].get('webViewLink')}")
    if repo:
        lines.append(f"Git: {repo.get('branch')} / {repo.get('commit')} / {repo.get('commit_subject')}")
    lines.append("")
    for p in data.get("projects", []):
        html = p.get("latest_html")
        zipf = p.get("source_zip")
        lines.append(f"{p['display']}: {p.get('folder_link')}")
        if html:
            lines.append(f"- 최신 HTML: {html.get('webViewLink')}")
        if zipf:
            lines.append(f"- 소스 ZIP: {zipf.get('webViewLink')}")
        if not html and not zipf:
            lines.append(f"- 업로드된 결과물 없음: {p.get('notes') or 'local artifact not found'}")
    print("\n".join(lines))

if __name__ == "__main__":
    main()
