#!/usr/bin/env python3
"""Publish Victory DTx prototype artifacts to Google Drive.

Default behavior:
- Ensures a Drive folder tree under "Victory DTx Prototypes".
- Uploads latest HTML artifacts and source ZIPs for configured subprojects.
- Updates same-name files in Drive instead of creating duplicates.
- Writes a local JSON report with Drive links for Slack reporting.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TOKEN_PATHS = [
    Path(os.environ.get("GOOGLE_TOKEN_PATH", "")) if os.environ.get("GOOGLE_TOKEN_PATH") else None,
    Path("/opt/data/google_token.json"),
    Path.home() / ".hermes" / "google_token.json",
]
DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]
CONFIG_PATH = REPO_ROOT / "scripts" / "drive_publish_config.json"
REPORT_PATH = REPO_ROOT / "scripts" / "last_drive_publish_report.json"


@dataclass
class Project:
    key: str
    display: str
    folder: str
    artifact_candidates: list[str]
    source_dir: str | None = None
    notes: str = ""


PROJECTS = [
    Project(
        key="behavioral-activation",
        display="Behavioral Activation",
        folder="behavioral-activation",
        artifact_candidates=["behavioral-activation/prototype", "behavioral-activation/index.html"],
        source_dir="behavioral-activation",
    ),
    Project(
        key="cbti-care",
        display="CBT-I Care",
        folder="cbti-care",
        artifact_candidates=["cbti-care/prototype", "cbti-care/index.html"],
        source_dir="cbti-care",
    ),
    Project(
        key="relax-routine",
        display="Relax Routine",
        folder="relax-routine",
        artifact_candidates=["relax-routine/prototype", "relax-routine/index.html"],
        source_dir="relax-routine",
    ),
    Project(
        key="relax-routine-pmr",
        display="Relax Routine PMR Lab",
        folder="relax-routine-pmr",
        artifact_candidates=["relax-routine-pmr/index.html", "relax-routine-pmr/pmr-blended-v2.html", "relax-routine-pmr"],
        source_dir="relax-routine-pmr",
    ),
    Project(
        key="family-link-coach",
        display="Family Link Coach",
        folder="family-link-coach",
        artifact_candidates=["family-link-coach/index.html"],
        source_dir="family-link-coach",
    ),
    Project(
        key="clinic-messenger",
        display="Clinic Messenger / DH Talk",
        folder="clinic-messenger",
        artifact_candidates=["DH-TALK_V2/app/index.html", "dh-talk/index.html"],
        source_dir="DH-TALK_V2",
        notes="DH Talk codebase; static preview may be minimal if the product requires a Vite build.",
    ),
    Project(
        key="rebound-care",
        display="Rebound Care",
        folder="rebound-care",
        artifact_candidates=["rebound-care/prototype", "rebound-care/index.html"],
        source_dir="rebound-care",
        notes="No local artifact found yet unless a future Rebound Care directory is added.",
    ),
]


def token_path() -> Path:
    for p in DEFAULT_TOKEN_PATHS:
        if p and p.exists():
            return p
    raise FileNotFoundError("Google token not found. Checked /opt/data/google_token.json and ~/.hermes/google_token.json")


def service():
    creds = Credentials.from_authorized_user_file(str(token_path()), scopes=DRIVE_SCOPES)
    return build("drive", "v3", credentials=creds)


def q_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def find_child_folder(svc, name: str, parent_id: str | None) -> str | None:
    parent_clause = f" and '{parent_id}' in parents" if parent_id else " and 'root' in parents"
    query = (
        "mimeType='application/vnd.google-apps.folder' and trashed=false"
        f" and name='{q_escape(name)}'" + parent_clause
    )
    resp = svc.files().list(q=query, fields="files(id,name,webViewLink)", pageSize=10).execute()
    files = resp.get("files", [])
    return files[0]["id"] if files else None


def create_folder(svc, name: str, parent_id: str | None) -> dict:
    meta = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
    if parent_id:
        meta["parents"] = [parent_id]
    return svc.files().create(body=meta, fields="id,name,webViewLink").execute()


def ensure_folder(svc, name: str, parent_id: str | None) -> dict:
    folder_id = find_child_folder(svc, name, parent_id)
    if folder_id:
        return svc.files().get(fileId=folder_id, fields="id,name,webViewLink").execute()
    return create_folder(svc, name, parent_id)


def ensure_tree(svc) -> dict[str, dict]:
    root = ensure_folder(svc, "Victory DTx Prototypes", None)
    folders = {"_root": root}
    for name in ["00_INDEX", "_automation", "_archives"]:
        folders[name] = ensure_folder(svc, name, root["id"])
    for project in PROJECTS:
        p = ensure_folder(svc, project.folder, root["id"])
        folders[project.key] = p
        folders[f"{project.key}/latest"] = ensure_folder(svc, "latest", p["id"])
        folders[f"{project.key}/archive"] = ensure_folder(svc, "archive", p["id"])
    return folders


def version_key(path: Path):
    m = re.search(r"v(\d+(?:\.\d+)*)", path.name, re.I)
    if not m:
        return (-1, path.stat().st_mtime)
    nums = tuple(int(x) for x in m.group(1).split("."))
    return (nums, path.stat().st_mtime)


def resolve_latest_artifact(project: Project) -> Path | None:
    candidates: list[Path] = []
    for cand in project.artifact_candidates:
        p = REPO_ROOT / cand
        if p.is_dir():
            htmls = [x for x in p.glob("*.html") if x.is_file()]
            if htmls:
                versioned = [x for x in htmls if re.search(r"v\d", x.name, re.I)]
                candidates.append(max(versioned or htmls, key=version_key))
        elif p.is_file() and p.suffix.lower() == ".html":
            candidates.append(p)
    if not candidates:
        return None
    versioned = [x for x in candidates if re.search(r"v\d", x.name, re.I)]
    return max(versioned or candidates, key=version_key)


def make_zip(project: Project, out_dir: Path) -> Path | None:
    if not project.source_dir:
        return None
    src = REPO_ROOT / project.source_dir
    if not src.exists():
        return None
    zip_path = out_dir / f"{project.key}-source-latest.zip"
    skip_dirs = {"node_modules", ".git", "dist", "build", ".next", "coverage", "test-results", "playwright-report"}
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in src.rglob("*"):
            if path.is_dir():
                continue
            if any(part in skip_dirs for part in path.relative_to(src).parts):
                continue
            zf.write(path, path.relative_to(REPO_ROOT))
    return zip_path


def find_existing_file(svc, name: str, parent_id: str) -> str | None:
    query = f"trashed=false and name='{q_escape(name)}' and '{parent_id}' in parents"
    resp = svc.files().list(q=query, fields="files(id,name)", pageSize=10).execute()
    files = resp.get("files", [])
    return files[0]["id"] if files else None


def ensure_anyone_reader(svc, file_id: str) -> None:
    """Make published review artifacts openable from Slack/phone without Google sign-in."""
    meta = svc.files().get(fileId=file_id, fields="permissions(id,type,role)").execute()
    if any(p.get("type") == "anyone" and p.get("role") in {"reader", "writer"} for p in meta.get("permissions", [])):
        return
    svc.permissions().create(
        fileId=file_id,
        body={"type": "anyone", "role": "reader"},
        fields="id",
    ).execute()


def upload_file(svc, local_path: Path, parent_id: str, drive_name: str, description: str = "") -> dict:
    mime, _ = mimetypes.guess_type(str(local_path))
    mime = mime or "application/octet-stream"
    media = MediaFileUpload(str(local_path), mimetype=mime, resumable=False)
    body = {"name": drive_name, "description": description}
    existing_id = find_existing_file(svc, drive_name, parent_id)
    if existing_id:
        item = svc.files().update(
            fileId=existing_id,
            body=body,
            media_body=media,
            fields="id,name,mimeType,webViewLink,webContentLink,modifiedTime",
        ).execute()
    else:
        body["parents"] = [parent_id]
        item = svc.files().create(
            body=body,
            media_body=media,
            fields="id,name,mimeType,webViewLink,webContentLink,modifiedTime",
        ).execute()
    ensure_anyone_reader(svc, item["id"])
    return item


def git_info() -> dict:
    def run(args: list[str]) -> str:
        try:
            return subprocess.check_output(args, cwd=REPO_ROOT, text=True).strip()
        except Exception:
            return ""
    return {
        "remote": run(["git", "remote", "get-url", "origin"]),
        "branch": run(["git", "branch", "--show-current"]),
        "commit": run(["git", "rev-parse", "--short", "HEAD"]),
        "commit_subject": run(["git", "log", "-1", "--format=%s"]),
    }


def write_index_markdown(folders: dict, project_reports: list[dict], out_dir: Path) -> Path:
    now = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    lines = [
        "# Victory DTx Prototypes Drive Index",
        "",
        f"Updated: {now}",
        "",
        f"Root folder: {folders['_root'].get('webViewLink', '')}",
        "",
        "## Latest artifacts",
        "",
    ]
    for r in project_reports:
        lines.append(f"### {r['display']}")
        lines.append(f"Folder: {r.get('folder_link','')}")
        if r.get("latest_html"):
            lines.append(f"Latest HTML: {r['latest_html']['name']} — {r['latest_html'].get('webViewLink','')}")
        else:
            lines.append("Latest HTML: not found locally")
        if r.get("source_zip"):
            lines.append(f"Source ZIP: {r['source_zip']['name']} — {r['source_zip'].get('webViewLink','')}")
        if r.get("notes"):
            lines.append(f"Notes: {r['notes']}")
        lines.append("")
    path = out_dir / "Victory-DTx-Drive-Index.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", action="append", help="Project key to publish. Repeatable. Default: all configured projects.")
    parser.add_argument("--no-zip", action="store_true", help="Skip source ZIP upload.")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    selected = [p for p in PROJECTS if not args.project or p.key in set(args.project)]
    if not selected:
        raise SystemExit(f"No matching project for {args.project}")

    svc = service()
    folders = ensure_tree(svc)

    with tempfile.TemporaryDirectory(prefix="victory-drive-publish-") as td:
        tmp = Path(td)
        reports = []
        for project in selected:
            latest_dir = folders[f"{project.key}/latest"]
            folder = folders[project.key]
            latest = resolve_latest_artifact(project)
            item = {
                "key": project.key,
                "display": project.display,
                "folder_link": folder.get("webViewLink"),
                "latest_html": None,
                "source_zip": None,
                "notes": project.notes,
            }
            if latest:
                latest_alias = f"{project.key}-latest.html"
                version_name = f"{project.key}-{latest.name}"
                item["latest_html"] = upload_file(
                    svc,
                    latest,
                    latest_dir["id"],
                    latest_alias,
                    description=f"Latest preview for {project.display}; source path {latest.relative_to(REPO_ROOT)}",
                )
                upload_file(
                    svc,
                    latest,
                    folders[f"{project.key}/archive"]["id"],
                    version_name,
                    description=f"Versioned archive for {project.display}; source path {latest.relative_to(REPO_ROOT)}",
                )
                item["local_latest_path"] = str(latest.relative_to(REPO_ROOT))
            if not args.no_zip:
                z = make_zip(project, tmp)
                if z:
                    item["source_zip"] = upload_file(
                        svc,
                        z,
                        latest_dir["id"],
                        z.name,
                        description=f"Latest source snapshot for {project.display}. Excludes node_modules/build caches.",
                    )
            reports.append(item)

        index_path = write_index_markdown(folders, reports, tmp)
        index_file = upload_file(svc, index_path, folders["00_INDEX"]["id"], "Victory-DTx-Drive-Index.md")

    final = {
        "published_at": datetime.now(timezone.utc).isoformat(),
        "repo": git_info(),
        "root_folder": folders["_root"],
        "index_file": index_file,
        "projects": reports,
    }
    REPORT_PATH.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(final, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
