#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/finish_and_publish.sh \"commit message\" [publish_to_drive args...]" >&2
  exit 2
fi

COMMIT_MESSAGE="$1"
shift || true

git status --short
if [[ -n "$(git status --short)" ]]; then
  git add -A
  git commit -m "$COMMIT_MESSAGE"
else
  echo "No local changes to commit."
fi

git pull --ff-only origin "$(git branch --show-current)"
git push origin "$(git branch --show-current)"

scripts/publish_to_drive.sh "$@"
python3 scripts/slack_drive_report.py
