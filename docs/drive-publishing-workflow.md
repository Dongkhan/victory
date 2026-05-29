# Drive publishing workflow

이 repo의 원본 소스는 GitHub private repo에 유지하고, 사용자가 확인할 산출물은 Google Drive `Victory DTx Prototypes` 폴더에 업로드한다.

## 폴더 구조

Drive root: `Victory DTx Prototypes`

하위 폴더:

- `behavioral-activation`
- `cbti-care`
- `relax-routine`
- `relax-routine-pmr`
- `family-link-coach`
- `clinic-messenger`
- `rebound-care`
- `00_INDEX`
- `_automation`
- `_archives`

각 앱 폴더에는 `latest`와 `archive`가 있다.

## 수동 업로드

```bash
./publish_to_drive.sh
```

특정 앱만 업로드:

```bash
./publish_to_drive.sh --project behavioral-activation
./publish_to_drive.sh --project cbti-care
./publish_to_drive.sh --project relax-routine
```

소스 ZIP 없이 HTML만 업로드:

```bash
./publish_to_drive.sh --no-zip
```

## 작업 완료 루틴

앞으로 앱 수정 작업 완료 시 기본 루틴은 다음이다.

```bash
scripts/finish_and_publish.sh "commit message"
```

이 명령은 다음을 순서대로 수행한다.

1. 변경사항 commit
2. 현재 branch를 GitHub origin에 push
3. Drive에 최신 HTML과 source ZIP 업로드
4. Slack 보고용 Drive 링크 요약 출력

## Slack 보고 원칙

사용자 보고에는 GitHub 링크 대신 Drive 링크를 우선 제공한다.
GitHub commit hash는 내부 추적용으로 한 줄만 남긴다.

## 현재 자동 탐색 규칙

- BA: `behavioral-activation/prototype`의 최신 `v*.html`
- CBT-I: `cbti-care/prototype`의 최신 `v*.html`
- Relax Routine: `relax-routine/prototype`의 최신 `v*.html`
- PMR Lab: `relax-routine-pmr` HTML
- Family Link Coach: `family-link-coach/index.html`
- Clinic Messenger / DH Talk: `DH-TALK_V2/app/index.html` 또는 `dh-talk/index.html`
- Rebound Care: `rebound-care` directory가 생기면 자동 탐색
