#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; ============================================================================
;  ScrollWM - PaperWM 스타일 가로 스크롤 타일링 (Windows / AutoHotkey v2)
; ----------------------------------------------------------------------------
;  창들을 화면 위에 가로로 한 줄(strip)로 배치하고, 좌우로 스크롤하면서
;  창 사이를 이동하는 macOS Hammerspoon(PaperWM.spoon) 스타일 윈도우 관리기.
;
;  주요 기능
;    - 모니터마다 독립적인 strip(가로 띠) 관리 (멀티 모니터 지원)
;    - 새 창 생성 / 종료 / 최소화 / 포커스 전환을 자동 감지해 띠를 갱신
;    - DeferWindowPos 기반의 부드러운 애니메이션 스크롤(깜빡임 없음)
;    - 화면 하단에 현재 위치를 보여주는 미니맵 HUD
;    - 투명 테두리 보정 + Per-Monitor DPI 인식
;
;  요구사항: AutoHotkey v2.0+ (https://www.autohotkey.com)
;  실행: 이 파일을 더블클릭하면 트레이에 상주한다.
; ============================================================================

; Per-Monitor DPI v2 로 선언(혼합 DPI 환경에서 좌표가 어긋나지 않도록).
; 이미 설정돼 있으면 실패해도 무시.
try DllCall("SetProcessDpiAwarenessContext", "ptr", -4)


; ============================== 설정 =========================================
class Config {
    static Gap         := 8       ; 창과 창 사이 간격(px)
    static OuterGap    := 8       ; 화면 가장자리 여백(px)
    static MinWidth    := 240     ; 창 최소 너비(px)
    static ScrollStep  := 160     ; 마우스 휠 한 칸당 스크롤 양(px)
    static ResizeStep  := 60      ; 너비 늘이기/줄이기 단위(px)

    static Widths        := [1/3, 1/2, 2/3, 1.0]  ; 너비 순환 프리셋(뷰포트 대비)
    static DefaultWidth  := 2     ; 새 창 기본 너비 = Widths[2] = 1/2

    static AutoManage  := true    ; 시작 시 새 창 자동 추적 on/off
    static Animate     := true    ; 스크롤 애니메이션 on/off
    static AnimEase    := 0.35    ; 애니메이션 감쇠 계수(0~1, 클수록 빠름)
    static AnimFps     := 120     ; 애니메이션 갱신 빈도(초당 프레임)

    static Hud         := true    ; 위치 HUD 표시 on/off
    static HudTimeout  := 1400    ; HUD 자동 숨김(ms)
}


; ============================== 자료구조 =====================================
; 한 모니터의 strip 상태. cols[i] = {hwnd, w, widx}
class Strip {
    cols   := []
    focus  := 0           ; 포커스 열 인덱스(1-based, 0 = 없음)
    scroll := 0.0         ; 현재 스크롤 위치(strip 좌표, 애니메이션용 실수)
    target := 0.0         ; 목표 스크롤 위치
    mon    := 0           ; 모니터 핸들(HMONITOR)
    WL := 0, WT := 0, WR := 0, WB := 0   ; 작업 영역
}


; ============================== 전역 상태 ====================================
global gStrips    := Map()              ; HMONITOR => Strip
global gActiveMon := 0                  ; 마지막으로 다룬 모니터
global gAuto      := Config.AutoManage  ; 자동 추적 on/off(런타임 토글)
global gBusy      := false              ; 우리가 유발한 이벤트 무시용 가드
global gHud       := 0                  ; HUD GUI 객체
global gHooks     := []                 ; SetWinEventHook 핸들들
global gHookProc  := 0                  ; 콜백 포인터


; ============================== 초기화 =======================================
; (AutoHotkey v2 자동 실행 스레드에서 확실히 돌도록 단축키 정의보다 위에 둔다)
SetupTray()
SetupHooks()
OnExit(Cleanup)
TrayTip("Win+Alt+R 로 타일링 시작 · Win+Alt+/ 로 도움말", "ScrollWM 실행됨", "Mute")


; ============================== 단축키 =======================================
; 기본 모디파이어: Win+Alt (#!). 명령은 Busy()로 감싸 우리 동작이
; 이벤트 훅을 재진입시키지 않도록 한다.
#!Left::   Busy(() => FocusDir(-1))     ; 이전 창으로 포커스
#!Right::  Busy(() => FocusDir(1))      ; 다음 창으로 포커스
#!+Left::  Busy(() => MoveDir(-1))      ; 현재 창을 왼쪽으로 이동
#!+Right:: Busy(() => MoveDir(1))       ; 현재 창을 오른쪽으로 이동
#!Home::   Busy(() => FocusEnd(-1))     ; 맨 왼쪽 창으로
#!End::    Busy(() => FocusEnd(1))      ; 맨 오른쪽 창으로

#!Enter::  Busy(() => CycleWidth())                  ; 너비 프리셋 순환
#!=::      Busy(() => GrowShrink(Config.ResizeStep)) ; 너비 늘이기
#!-::      Busy(() => GrowShrink(-Config.ResizeStep)) ; 너비 줄이기
#!c::      Busy(() => CenterFocused())  ; 화면 가운데로
#!f::      Busy(() => ToggleFull())     ; 뷰포트 전체 너비 토글

#!r::      Busy(() => RetileAll())      ; 현재 모니터 창 전부 타일링
#!a::      Busy(() => AddActive())      ; 활성 창을 띠에 추가
#!d::      Busy(() => RemoveActive())   ; 활성 창을 띠에서 제외
#!t::      ToggleAuto()                 ; 자동 추적 on/off
#!/::      ShowHelp()                   ; 도움말

; Win + 마우스 휠: 띠를 좌우로 스크롤
#WheelDown:: Busy(() => ScrollBy(Config.ScrollStep))
#WheelUp::   Busy(() => ScrollBy(-Config.ScrollStep))


; ============================== 명령 =========================================
FocusDir(dir) {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    SyncFocus(s)
    s.focus := Clamp(s.focus + dir, 1, s.cols.Length)
    ActivateCol(s)
    RelayoutStrip(s)
    ShowHud(s)
}

FocusEnd(dir) {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    s.focus := (dir < 0) ? 1 : s.cols.Length
    ActivateCol(s)
    RelayoutStrip(s)
    ShowHud(s)
}

MoveDir(dir) {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    SyncFocus(s)
    n := s.focus + dir
    if (n < 1 || n > s.cols.Length)
        return
    tmp := s.cols[s.focus]
    s.cols[s.focus] := s.cols[n]
    s.cols[n] := tmp
    s.focus := n
    ActivateCol(s)
    RelayoutStrip(s)
    ShowHud(s)
}

CycleWidth() {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    SyncFocus(s)
    col := s.cols[s.focus]
    col.widx := Mod(col.widx, Config.Widths.Length) + 1
    col.w := RatioWidth(s, Config.Widths[col.widx])
    RelayoutStrip(s)
    ShowHud(s)
}

GrowShrink(delta) {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    SyncFocus(s)
    col := s.cols[s.focus]
    col.w := Clamp(col.w + delta, Config.MinWidth, ViewWidth(s))
    col.widx := 0                       ; 사용자 지정 너비
    RelayoutStrip(s)
}

ToggleFull() {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    SyncFocus(s)
    col := s.cols[s.focus]
    full := ViewWidth(s)
    col.w := (col.w >= full - 2) ? RatioWidth(s, 1/2) : full
    col.widx := 0
    CenterFocused()
}

CenterFocused() {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    SyncFocus(s)
    fL := ColLeft(s, s.focus)
    s.target := fL + s.cols[s.focus].w / 2 - ViewWidth(s) / 2
    RelayoutStrip(s, false)             ; 스크롤 자동조정 끄고 가운데 유지
    ShowHud(s)
}

ScrollBy(delta) {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    s.target += delta
    RelayoutStrip(s, false)
}

AddActive() {
    a := WinExist("A")
    if (!a || !IsTileable(a) || FindCol(a))
        return
    s := CurStrip(true)
    AddHwndToStrip(s, a, true)
    RelayoutStrip(s)
    ShowHud(s)
}

RemoveActive() {
    s := CurStrip(false)
    if (!s || !s.cols.Length)
        return
    SyncFocus(s)
    s.cols.RemoveAt(s.focus)
    s.focus := Min(s.focus, s.cols.Length)
    if (s.focus >= 1)
        ActivateCol(s)
    RelayoutStrip(s)
    ShowHud(s)
}

RetileAll() {
    a := WinExist("A")
    if !a {
        for hwnd in WinGetList() {
            if IsTileable(hwnd) {
                a := hwnd
                break
            }
        }
    }
    if !a
        return
    mon := MonitorOf(a)
    gActiveMon := mon
    s := GetOrCreateStrip(mon)

    list := []
    for hwnd in WinGetList() {
        if (IsTileable(hwnd) && MonitorOf(hwnd) = mon)
            list.Push(hwnd)
    }
    SortByX(list)

    s.cols := []
    s.scroll := 0.0
    s.target := 0.0
    for hwnd in list {
        try WinRestore("ahk_id " hwnd)
        AddHwndToStrip(s, hwnd, false)
    }
    s.focus := s.cols.Length ? 1 : 0
    SyncFocus(s)
    RelayoutStrip(s, true, false)       ; 첫 배치는 애니메이션 없이 즉시
    if s.cols.Length
        ActivateCol(s)
    ShowHud(s)
}

ToggleAuto() {
    global gAuto
    gAuto := !gAuto
    TrayTip((gAuto ? "자동 추적 켜짐" : "자동 추적 꺼짐"), "ScrollWM", "Mute")
}


; ============================== 레이아웃 / 애니메이션 ========================
; 목표 스크롤을 계산하고(필요하면 포커스가 보이도록 조정) 애니메이션을 건다.
RelayoutStrip(s, adjustScroll := true, animate := true) {
    PruneStrip(s)
    if !s.cols.Length {
        return
    }
    RefreshWorkArea(s)
    viewW := ViewWidth(s)

    ; 열들의 strip 좌표와 전체 너비
    cx := 0
    fL := 0
    for i, col in s.cols {
        if (i = s.focus)
            fL := cx
        cx += col.w + Config.Gap
    }
    totalW := cx - Config.Gap

    ; 포커스 창이 뷰포트에 완전히 보이도록 목표 스크롤 조정
    if (adjustScroll && s.focus >= 1) {
        fR := fL + s.cols[s.focus].w
        if (fL - s.target < 0)
            s.target := fL
        else if (fR - s.target > viewW)
            s.target := fR - viewW
    }
    ; 범위 제한
    s.target := Clamp(s.target, 0, Max(0, totalW - viewW))

    if (!Config.Animate || !animate) {
        s.scroll := s.target
        ApplyPositions(s)
    } else {
        StartAnim()
    }
}

; 애니메이션 타이머: 정착되지 않은 모든 strip을 목표로 부드럽게 이동
AnimStep() {
    moving := false
    for mon, s in gStrips {
        if (Abs(s.scroll - s.target) > 0.5) {
            s.scroll += (s.target - s.scroll) * Config.AnimEase
            if (Abs(s.scroll - s.target) <= 0.5)
                s.scroll := s.target
            ApplyPositions(s)
            moving := true
        }
    }
    if !moving
        SetTimer(AnimStep, 0)
}

StartAnim() {
    SetTimer(AnimStep, Round(1000 / Config.AnimFps))
}

; 현재 scroll 값 기준으로 모든 창을 한 번에(DeferWindowPos) 재배치
ApplyPositions(s) {
    n := s.cols.Length
    if !n
        return
    Pad := Config.OuterGap
    viewH := (s.WB - s.WT) - 2 * Pad
    scroll := Round(s.scroll)

    hdwp := DllCall("BeginDeferWindowPos", "int", n, "ptr")
    cx := 0
    for i, col in s.cols {
        if WinExist("ahk_id " col.hwnd) {
            sx := s.WL + Pad + cx - scroll
            sy := s.WT + Pad
            GetFrameOffsets(col.hwnd, &ol, &ot, &orr, &ob)
            x := sx - ol, y := sy - ot
            w := col.w + ol + orr, h := viewH + ot + ob
            ; SWP_NOZORDER(0x4) | SWP_NOACTIVATE(0x10) = 0x14
            if hdwp {
                hdwp := DllCall("DeferWindowPos", "ptr", hdwp, "ptr", col.hwnd
                    , "ptr", 0, "int", x, "int", y, "int", w, "int", h, "uint", 0x14, "ptr")
            }
            if !hdwp
                try WinMove(x, y, w, h, "ahk_id " col.hwnd)
        }
        cx += col.w + Config.Gap
    }
    if hdwp
        DllCall("EndDeferWindowPos", "ptr", hdwp)
}

; 닫힌 창을 strip에서 제거
PruneStrip(s) {
    cleaned := []
    for col in s.cols {
        if WinExist("ahk_id " col.hwnd)
            cleaned.Push(col)
    }
    if (cleaned.Length != s.cols.Length) {
        s.cols := cleaned
        s.focus := s.cols.Length ? Clamp(s.focus, 1, s.cols.Length) : 0
    }
}


; ============================== 자동 추적 (이벤트 훅) ========================
SetupHooks() {
    global gHookProc, gHooks
    gHookProc := CallbackCreate(WinEventProc, "F", 7)
    HookRange(0x0003, 0x0003)   ; EVENT_SYSTEM_FOREGROUND
    HookRange(0x0016, 0x0017)   ; MINIMIZESTART .. MINIMIZEEND
    HookRange(0x8000, 0x8003)   ; OBJECT_CREATE/DESTROY/SHOW/HIDE
}

HookRange(emin, emax) {
    global gHookProc, gHooks
    ; WINEVENT_OUTOFCONTEXT = 0 → 우리 메시지 큐로 전달(스레드 안전)
    h := DllCall("SetWinEventHook", "uint", emin, "uint", emax, "ptr", 0
        , "ptr", gHookProc, "uint", 0, "uint", 0, "uint", 0, "ptr")
    gHooks.Push(h)
}

WinEventProc(hHook, event, hwnd, idObject, idChild, idThread, dwmsTime) {
    ; 최상위 창 자체 이벤트만 처리(OBJID_WINDOW=0, CHILDID_SELF=0)
    if (idObject != 0 || idChild != 0 || !hwnd || gBusy)
        return
    switch event {
        case 0x0003:            ; FOREGROUND
            OnForeground(hwnd)
        case 0x0017:            ; MINIMIZEEND (복원)
            if gAuto
                TryAdd(hwnd)
        case 0x0016, 0x8001, 0x8003:   ; MINIMIZESTART / DESTROY / HIDE
            RemoveHwnd(hwnd)
        case 0x8000, 0x8002:    ; CREATE / SHOW (준비 전일 수 있어 지연 확인)
            if gAuto
                SetTimer(TryAddBound(hwnd), -150)
    }
}

; 지연 호출용 바운드 함수 생성
TryAddBound(hwnd) {
    return () => TryAdd(hwnd)
}

OnForeground(hwnd) {
    fc := FindCol(hwnd)
    if fc {
        s := fc[1]
        s.focus := fc[2]
        gActiveMon := s.mon
        RelayoutStrip(s)
        ShowHud(s)
    } else if (gAuto && IsTileable(hwnd)) {
        TryAdd(hwnd)
    }
}

TryAdd(hwnd) {
    if (!gAuto || !IsTileable(hwnd) || FindCol(hwnd))
        return
    s := GetOrCreateStrip(MonitorOf(hwnd))
    AddHwndToStrip(s, hwnd, true)
    RelayoutStrip(s)
    ShowHud(s)
}

RemoveHwnd(hwnd) {
    for mon, s in gStrips {
        idx := IndexOf(s, hwnd)
        if idx {
            s.cols.RemoveAt(idx)
            s.focus := s.cols.Length ? Clamp(s.focus, 1, s.cols.Length) : 0
            RelayoutStrip(s)
            return
        }
    }
}


; ============================== HUD (위치 표시) ==============================
ShowHud(s) {
    global gHud
    if (!Config.Hud || !s.cols.Length || s.focus < 1)
        return

    idx := s.focus, tot := s.cols.Length
    title := WinExist("ahk_id " s.cols[idx].hwnd) ? WinGetTitle("ahk_id " s.cols[idx].hwnd) : ""
    if (StrLen(title) > 48)
        title := SubStr(title, 1, 48) "…"

    bar := ""
    for i, col in s.cols
        bar .= (i = idx) ? "▮" : "▯"
    text := bar "`n" idx " / " tot "    " title

    if !gHud {
        ; -Caption(테두리 없음) +ToolWindow(작업표시줄 제외) +E0x20(클릭통과) +E0x80000(레이어드)
        gHud := Gui("+AlwaysOnTop -Caption +ToolWindow +E0x20 +E0x80000", "ScrollWM HUD")
        gHud.BackColor := "202020"
        gHud.MarginX := 18, gHud.MarginY := 12
        gHud.SetFont("s11 cE0E0E0", "Segoe UI")
        gHud.Add("Text", "vHudText Center", text)
    }
    gHud["HudText"].Value := text
    gHud.Show("NoActivate AutoSize Hide")    ; 크기 계산용
    gHud.GetPos(, , &gw, &gh)
    cx := (s.WL + s.WR) // 2 - gw // 2
    cy := s.WB - gh - 64
    gHud.Show("NoActivate x" cx " y" cy)
    WinSetTransparent(225, "ahk_id " gHud.Hwnd)
    SetTimer(HideHud, -Config.HudTimeout)
}

HideHud(*) {
    global gHud
    if gHud
        try gHud.Hide()
}


; ============================== 헬퍼 =========================================
Busy(fn) {
    global gBusy
    prev := gBusy
    gBusy := true
    try fn()
    finally
        gBusy := prev
}

Clamp(v, lo, hi) {
    return (v < lo) ? lo : (v > hi) ? hi : v
}

ViewWidth(s) {
    return (s.WR - s.WL) - 2 * Config.OuterGap
}

RatioWidth(s, ratio) {
    return Round(ViewWidth(s) * ratio)
}

ColLeft(s, idx) {
    x := 0
    for i, col in s.cols {
        if (i = idx)
            return x
        x += col.w + Config.Gap
    }
    return x
}

ActivateCol(s) {
    if (s.focus >= 1 && s.focus <= s.cols.Length)
        try WinActivate("ahk_id " s.cols[s.focus].hwnd)
}

; 활성 창이 strip 안에 있으면 focus 동기화
SyncFocus(s) {
    a := WinExist("A")
    for i, col in s.cols {
        if (col.hwnd = a) {
            s.focus := i
            return true
        }
    }
    return false
}

; 현재 다룰 strip = 활성 창의 모니터(없으면 마지막 모니터)
CurStrip(create := true) {
    global gActiveMon
    a := WinExist("A")
    mon := a ? MonitorOf(a) : gActiveMon
    if !mon
        return 0
    gActiveMon := mon
    if gStrips.Has(mon)
        return gStrips[mon]
    return create ? GetOrCreateStrip(mon) : 0
}

GetOrCreateStrip(mon) {
    if gStrips.Has(mon)
        return gStrips[mon]
    s := Strip()
    s.mon := mon
    GetWorkAreaByMon(mon, &wl, &wt, &wr, &wb)
    s.WL := wl, s.WT := wt, s.WR := wr, s.WB := wb
    gStrips[mon] := s
    return s
}

AddHwndToStrip(s, hwnd, afterFocus) {
    RefreshWorkArea(s)
    col := { hwnd: hwnd, w: RatioWidth(s, Config.Widths[Config.DefaultWidth]), widx: Config.DefaultWidth }
    try WinRestore("ahk_id " hwnd)
    if (afterFocus && s.focus >= 1) {
        s.cols.InsertAt(s.focus + 1, col)
        s.focus += 1
    } else {
        s.cols.Push(col)
        s.focus := s.cols.Length
    }
}

FindCol(hwnd) {
    for mon, s in gStrips {
        idx := IndexOf(s, hwnd)
        if idx
            return [s, idx]
    }
    return 0
}

IndexOf(s, hwnd) {
    for i, col in s.cols {
        if (col.hwnd = hwnd)
            return i
    }
    return 0
}

RefreshWorkArea(s) {
    GetWorkAreaByMon(s.mon, &wl, &wt, &wr, &wb)
    s.WL := wl, s.WT := wt, s.WR := wr, s.WB := wb
}

GetWorkAreaByMon(hMon, &L, &T, &R, &B) {
    mi := Buffer(40, 0)
    NumPut("uint", 40, mi, 0)
    DllCall("GetMonitorInfo", "ptr", hMon, "ptr", mi)
    L := NumGet(mi, 20, "int"), T := NumGet(mi, 24, "int")
    R := NumGet(mi, 28, "int"), B := NumGet(mi, 32, "int")
}

MonitorOf(hwnd) {
    return DllCall("MonitorFromWindow", "ptr", hwnd, "uint", 2, "ptr")   ; NEAREST
}

; 창을 (X,Y,W,H) "보이는 프레임" 기준으로 옮기기 위한 투명 테두리 두께
GetFrameOffsets(hwnd, &ol, &ot, &orr, &ob) {
    ol := ot := orr := ob := 0
    rect := Buffer(16, 0)
    if !DllCall("GetWindowRect", "ptr", hwnd, "ptr", rect)
        return
    wl := NumGet(rect, 0, "int"), wt := NumGet(rect, 4, "int")
    wr := NumGet(rect, 8, "int"), wb := NumGet(rect, 12, "int")
    fb := Buffer(16, 0)
    ; DWMWA_EXTENDED_FRAME_BOUNDS = 9
    if (DllCall("dwmapi\DwmGetWindowAttribute", "ptr", hwnd, "uint", 9, "ptr", fb, "uint", 16) != 0)
        return
    fl := NumGet(fb, 0, "int"), ft := NumGet(fb, 4, "int")
    fr := NumGet(fb, 8, "int"), fbm := NumGet(fb, 12, "int")
    ol := fl - wl, ot := ft - wt, orr := wr - fr, ob := wb - fbm
}

; 타일링 대상이 되는 "보통의" 최상위 창인지 판단
IsTileable(hwnd) {
    if !WinExist("ahk_id " hwnd)
        return false
    if (WinGetTitle("ahk_id " hwnd) = "")
        return false
    style   := WinGetStyle("ahk_id " hwnd)
    exStyle := WinGetExStyle("ahk_id " hwnd)
    if !(style & 0x10000000)              ; WS_VISIBLE
        return false
    if !(style & 0x00C00000)              ; WS_CAPTION
        return false
    if (exStyle & 0x00000080)             ; WS_EX_TOOLWINDOW
        return false
    if (WinGetMinMax("ahk_id " hwnd) = -1) ; 최소화됨
        return false
    if DllCall("GetWindow", "ptr", hwnd, "uint", 4, "ptr")   ; GW_OWNER → 다이얼로그류 제외
        return false
    if IsCloaked(hwnd)                    ; 숨겨진 UWP/가상 데스크톱 창
        return false
    static skip := Map("Progman", 1, "WorkerW", 1, "Shell_TrayWnd", 1
        , "Windows.UI.Core.CoreWindow", 1, "TaskManagerWindow", 0)
    cls := WinGetClass("ahk_id " hwnd)
    if (skip.Has(cls) && skip[cls])
        return false
    return true
}

IsCloaked(hwnd) {
    buf := Buffer(4, 0)
    ; DWMWA_CLOAKED = 14
    if (DllCall("dwmapi\DwmGetWindowAttribute", "ptr", hwnd, "uint", 14, "ptr", buf, "uint", 4) = 0)
        return NumGet(buf, 0, "int") != 0
    return false
}

; hwnd 목록을 화면 X좌표 오름차순으로 정렬(삽입 정렬, N 작음)
SortByX(list) {
    keyX := Map()
    for hwnd in list {
        try {
            WinGetPos(&x, , , , "ahk_id " hwnd)
            keyX[hwnd] := x
        } catch {
            keyX[hwnd] := 0
        }
    }
    i := 2
    while (i <= list.Length) {
        cur := list[i], j := i - 1
        while (j >= 1 && keyX[list[j]] > keyX[cur]) {
            list[j + 1] := list[j]
            j -= 1
        }
        list[j + 1] := cur
        i += 1
    }
}

ShowHelp() {
    txt := "
(
ScrollWM — PaperWM 스타일 가로 스크롤 타일링

[ 시작 / 추적 ]
  Win+Alt+R         현재 모니터 창 전부 타일링
  Win+Alt+A         활성 창을 띠에 추가
  Win+Alt+D         활성 창을 띠에서 제외
  Win+Alt+T         자동 추적 켜기/끄기

[ 이동 / 포커스 ]
  Win+Alt+←/→       이전 / 다음 창으로
  Win+Alt+Home/End  맨 왼쪽 / 맨 오른쪽 창으로
  Win+Alt+Shift+←/→ 현재 창을 좌 / 우로 이동
  Win+(마우스 휠)    띠를 좌우로 스크롤

[ 크기 ]
  Win+Alt+Enter     너비 순환(1/3 → 1/2 → 2/3 → 전체)
  Win+Alt+= / -     너비 늘이기 / 줄이기
  Win+Alt+F         뷰포트 전체 너비 토글
  Win+Alt+C         화면 가운데로 정렬

  Win+Alt+/         이 도움말
)"
    MsgBox(txt, "ScrollWM 도움말", "Iconi")
}


; ============================== 트레이 / 초기화 ==============================
SetupTray() {
    TraySetIcon("shell32.dll", 264)
    tm := A_TrayMenu
    tm.Delete()
    tm.Add("도움말 (Win+Alt+/)", (*) => ShowHelp())
    tm.Add("전체 타일링 (Win+Alt+R)", (*) => Busy(() => RetileAll()))
    tm.Add("자동 추적 토글 (Win+Alt+T)", (*) => ToggleAuto())
    tm.Add()
    tm.Add("스크립트 재시작", (*) => Reload())
    tm.Add("종료", (*) => ExitApp())
    tm.Default := "도움말 (Win+Alt+/)"
}

Cleanup(*) {
    global gHooks, gHookProc
    for h in gHooks
        try DllCall("UnhookWinEvent", "ptr", h)
    if gHookProc
        try CallbackFree(gHookProc)
}
