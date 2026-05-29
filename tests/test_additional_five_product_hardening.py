from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def test_rr_route_stack_and_single_canonical_storage_key():
    html = read("relax-routine/prototype/v3.1.html")
    assert "RelaxRouteStack={push," not in html
    assert "push: pushRoute" in html
    assert "const STORAGE_KEY='relax-routine-v31-mobile-state'" in html
    assert "relax-routine-v22-mobile-state" not in html
    assert "relax-routine-v25-mobile-state" not in html
    assert html.index("@keyframes heartPulse") < html.index("@keyframes heartCalmPulse")
    heart_pulse_block = html.split("@keyframes heartPulse", 1)[1].split("@keyframes heartCalmPulse", 1)[0]
    assert heart_pulse_block.count("{") == heart_pulse_block.count("}")


def test_ba_crisis_lock_blocks_all_non_clinic_routes_and_has_phone_ctas_without_legacy_text():
    html = read("behavioral-activation/prototype/v2.8.html")
    assert "tab !== 'clinic'" in html or "tab!='clinic'" in html
    assert "['today','life','support']" not in html
    assert "href=\"tel:119\"" in html
    assert "href=\"tel:109\"" in html
    assert "legacy verified links" not in html
    assert not re.search(r"v2\.0\.html\s+v2\.1\.html", html)
    assert "행동 카드을" not in html
    assert "행동 카드으로" not in html
    assert "inert" in html


def test_cbti_srt_copy_matches_gate_and_phone_ctas_and_service_worker_path():
    html = read("cbti-care/prototype/v2.272.html")
    assert "SRT 독립 안전 스크리닝" not in html
    assert "현재 앱에서 자동 판정하지 않음" in html
    assert "href=\"tel:119\"" in html
    assert "href=\"tel:109\"" in html
    assert "prototype/v2.272.html" not in html
    assert "'v2.272.html'" in html
    assert "inert" in html


def test_dfc_prerequisite_guard_escape_phone_ctas_and_non_stale_qa_hook():
    html = read("family-link-coach/index.html")
    assert "function esc(" in html
    assert "canSaveContract" in html
    assert "계약서 예시만 보기" in html
    assert "계약서 저장하고 설정 체크리스트로" in html
    assert "보호자 확인 후 저장 가능" in html
    assert "href=\"tel:119\"" in html
    assert "href=\"tel:109\"" in html
    assert "request:{reason:'게임 저장/마무리', minutes:10, finish:'충전 장소에 두기', status:'요청 전'}" in html
    assert "get state(){return state}" in html
    assert "aria-pressed" in html
    assert "✓ 자해·자살 언급" not in html


def test_dht2_static_readiness_markers_for_additional_hardening():
    use_board = read("DH-TALK_V2/app/src/features/patients/usePatientBoard.ts")
    assert "fallbackRepository" in use_board
    assert "syncState: 'pending'" in use_board
    assert "mutationError" in use_board

    call_stack = read("DH-TALK_V2/app/src/features/alerts/CallAlertStack.tsx")
    assert "playCallAlertBeep" in call_stack
    assert "soundError" in call_stack

    call_repo = read("DH-TALK_V2/app/src/data/callRepository.ts")
    assert "AlertAlreadyAcknowledgedError" in call_repo
    assert "select('id')" in call_repo

    app = read("DH-TALK_V2/app/src/App.tsx")
    assert "공통 매크로는 Supabase 공유 전까지 이 PC에만 저장됩니다" in app
    assert "handleRemoveFile" in app
    assert "URL.revokeObjectURL" in app

    board = read("DH-TALK_V2/app/src/features/patients/PatientBoard.tsx")
    assert "loading" in board
    assert "error" in board
    assert "setTimeout" in board
    assert "aria-label={`${patient.name} 위로 이동`}" in board
    assert "aria-label={`${patient.name} 아래로 이동`}" in board


def test_round2_static_release_guards_for_ba_dfc_dht2_rr():
    ba = read("behavioral-activation/prototype/v2.8.html")
    assert "function crisisActionsHtml()" in ba
    assert "crisisActionsHtml()" in ba.split("function applyCrisisLock()", 1)[1].split("function startTimer()", 1)[0]

    dfc = read("family-link-coach/index.html")
    assert "const initialScreen=hasCrisisLock()?'crisis':(state.screen||'start')" in dfc
    assert "위기 신호 해제 확인" in dfc

    migration = read("DH-TALK_V2/supabase/migrations/001_initial_schema.sql")
    assert "acknowledged_by text" in migration
    assert "acknowledged_device text" in migration

    rr_index = read("relax-routine/index.html")
    rr = read("relax-routine/prototype/v3.4.html")
    assert "prototype/v3.4.html" in rr_index
    assert "Relax Routine v3.4" in rr_index
    assert 'data-version="3.4"' in rr or "document.body.dataset.version='3.4'" in rr
    assert "rr-completion-polish-v34" in rr
    assert "오늘 한 번만 끝내기" in rr
    assert "커질 때 5초간 힘을 주고, 작아질 때 10초간 힘을 놓습니다" not in rr
    assert "rr-v34-ui-declutter" in rr
    assert "relax-routine-v34-mobile-state" in rr
    assert "relax-v34-home" in rr
    assert "home-select-execute-complete" in rr
    assert "suppressHome()" in rr
    assert "homeSuppressed()" in rr
    assert "Initial boot must always be allowed to reach the v3.4 first screen" in rr
    assert "A suppression deadline is valid only inside the current page instance after a routine click" in rr
    assert "sessionStorage.removeItem('rr-v34-suppress-home-until')" in rr
    assert "function clearBootLoader()" in rr
    assert "window.__rrV34ForceHome" in rr
    assert "rrV34FirstScreenWatchdog" in rr
    assert "view:'session'" in rr
    assert "window.openRelaxPmrV3" in rr
    assert "window.openRelaxPmrV3({autoStart:true})" in rr
    assert "open({autoStart:true})" in rr
    assert "rr-pmr-running" in rr
    assert "opacity:.34!important" in rr
    assert "opacity:.9!important" in rr
    assert "position:absolute!important;right:16px!important;top:116px!important" in rr
    assert "bottom:14px!important" in rr
    assert "concise&&/(점진적\\s*근(?:육)?이완|근육이완|PMR)/i.test(t)" in rr
    assert "시간 바꾸기" in rr
    assert "안전 장소 심상" not in rr



def test_round2_dht2_pending_replay_local_dismiss_and_polling_markers():
    app = read("DH-TALK_V2/app/src/App.tsx")
    assert "alert?.syncState && alert.syncState !== 'remote'" in app
    assert "setInterval(loadAlerts" in app
    assert "realtimeStatus" in app

    board = read("DH-TALK_V2/app/src/features/patients/usePatientBoard.ts")
    assert "replayPendingLocalChanges" in board
    assert "patient.syncState === 'pending'" in board
    assert "동기화 대기 항목" in board
