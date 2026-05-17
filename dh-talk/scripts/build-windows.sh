#!/usr/bin/env bash
# Windows 설치본(.exe) 빌드 — Mac 에서 실행.
set -e
cd "$(dirname "$0")/.."
npm run build:win
