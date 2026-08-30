# 러닝퀘스트 · Run Quest (v0.1 MVP)

달리기를 게임처럼 만드는 오프라인 러닝 앱 프로토타입. 단일 HTML 파일이며 빌드·설치·계정·서버가 없습니다.

- 최신 실행본: `prototype/v0.1.html`
- 짧은 주소: `/run`, `/running`, `/run-quest`

## MVP 범위

| 영역 | 내용 |
| --- | --- |
| 트래킹 | `geolocation.watchPosition` 기반 거리(haversine)·시간·현재 페이스·1km 스플릿·경로 캔버스 |
| 모드 | 자유 달리기 / 스토리 러닝(좀비 추격 챌린지) / 인터벌 챌린지(3분 워밍업 → 1분 빠르게·2분 회복 ×5 → 3분 쿨다운) |
| 게임화 | 코인(200m마다 + 스플릿·챌린지 보상), XP·레벨, 16종 배지, 연속 달린 날(스트릭), 매일 3개 데일리 퀘스트 |
| 기록 | 세션 목록·상세(경로·스플릿), 주간 막대 차트, 누적 통계, 개인 기록(가장 빠른 1km·최장 거리) |
| 코치 | 음성 안내(SpeechSynthesis, ko-KR), 진동 피드백, 자동 일시정지, 화면 켜두기(Wake Lock) |
| 데이터 | `localStorage("runquest.v1")` 전용. 내보내기(JSON)·전체 삭제 제공, 외부 전송 없음 |

## 위치 권한이 없을 때

`데모 모드`를 켜거나 위치 권한이 거부되면 가상 경로 시뮬레이터로 전체 흐름을 그대로 체험할 수 있습니다.
데모로 만든 기록은 목록에 `데모`로 표시됩니다.

## 안전

온보딩·달리기 준비·설정 화면에 안전 고지가 있습니다. 의료기기가 아니며 진단·치료를 대신하지 않습니다.
운동 중 가슴 통증·호흡곤란·실신감이 있으면 즉시 중단하고 119에 연락하도록 안내합니다.

## 접근성

`prefers-reduced-motion` 및 앱 내 "애니메이션 줄이기" 토글, `:focus-visible` 아웃라인, 44px 이상 터치 타깃,
`aria-live` 코치/챌린지 안내, 탭 `role=tab`/`aria-selected`, 스위치 `role=switch`/`aria-checked`, 라이트·다크 모드 대응.

## 다음 버전 후보

- 실제 지도 타일(오프라인 제약 검토) 및 고도·심박 연동
- 친구와 함께 달리기(비동기 고스트 러너)
- 주간 리포트 및 목표 코칭

## 안드로이드 APK

`capacitor-app/` 이 Capacitor 8 래퍼입니다. 웹 자산은 `prototype/v0.1.html` 하나를
`capacitor-app/www/index.html` 로 복사해 쓰며, 두 파일이 다르면 테스트가 실패합니다.

### 내려받기 (직접 빌드하지 않는 경우)

`run-quest/**` 에 푸시가 들어가면 GitHub Actions 워크플로
`.github/workflows/run-quest-android.yml` 가 APK를 빌드해 두 곳에 올립니다.

- 워크플로 실행 페이지의 아티팩트 `run-quest-debug-apk`
- 릴리스 태그 `run-quest-v0.1.0` 의 자산 `run-quest-v0.1.0-debug.apk` (직접 다운로드 링크)

안드로이드에서 APK를 열고 '출처를 알 수 없는 앱 설치'를 허용하면 됩니다.
디버그 서명 빌드라 사이드로딩 전용이며 Play 스토어 배포본이 아닙니다.

### 직접 빌드

필요: JDK 21, Android SDK(platform 36 / build-tools 36.0.0), Node 20+.

```bash
cd run-quest/capacitor-app
npm ci
npm run apk:debug          # www 복사 → cap sync → gradlew assembleDebug
# 결과: android/app/build/outputs/apk/debug/app-debug.apk
```

아이콘·스플래시는 외부 에셋 없이 생성됩니다: `npm run icons` (Pillow 필요).

### 네이티브 권한

| 권한 | 쓰임 |
| --- | --- |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | 달리기 거리·경로 계산. 기기 밖으로 전송하지 않음 |
| `VIBRATE` | 스플릿·챌린지 진동 피드백 |
| `INTERNET` | Capacitor 로컬 WebView 스킴(외부 통신 없음) |

GPS는 `required=false` 라 GPS 없는 기기에도 설치되며, 권한을 거부하면 데모 모드로 동작합니다.

### 안드로이드에서의 제약

- 음성 안내: 안드로이드 WebView에는 `speechSynthesis` 가 없어 무음으로 동작합니다(코드가 방어 처리).
  네이티브 TTS가 필요하면 후속 버전에서 Capacitor TTS 플러그인을 붙이면 됩니다.
- 화면 켜두기: WebView에 `navigator.wakeLock` 이 없으면 자동으로 무시됩니다.
