#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
exec scripts/publish_to_drive.sh "$@"
