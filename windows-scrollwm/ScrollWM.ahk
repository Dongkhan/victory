#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; ============================================================================
;  ScrollWM - PaperWM 스타일 가로 스크롤 타일링 (Windows / AutoHotkey v2)
; ----------------------------------------------------------------------------
;  창들을 화면 위에 가로로 한 줄(strip)로 배치하고, 좌우로 스크롤하면서
;  창 사이를 이동하는 macOS Hammerspoon(PaperWM.spoon) 스타일 윈도우 관리기.
;
;  핵심 개념
;    - 추적 중인 창들은 "strip"이라는 가상의 가로 띠 위에 순서대로 놓인다.
;    - 화면(작업 영역)은 그 띠를 들여다보는 "뷰포트"다.
;    - 포커스를 옮기거나 스크롤하면 띠가 좌우로 움직이며 창이 드러난다.
;
;  요구사항: AutoHotkey v2.0+ (https://www.autohotkey.com)
;  실행: 이 파일을 더블클릭하면 트레이에 상주한다. (재시작: 트레이 > Reload)
; ============================================================================


; ============================== 설정 =========================================
class Config {
    static Gap        := 8        ; 창과 창 사이 간격(px)
    static OuterGap   := 8        ; 화면 가장자리 여백(px)
    static MinWidth   := 240      ; 창 최소 너비(px)
    static ScrollStep := 120      ; 마우스 휠 한 칸당 스크롤 양(px)
    static ResizeStep := 60       ; 너비 늘이기/줄이기 단위(px)

    ; 너비를 순환(Win+Alt+Enter)할 때 사용할 뷰포트 대비 비율
    static Widths        := [1/3, 1/2, 2/3, 1.0]
    static DefaultWidth  := 2     ; 새 창 기본 너비 = Widths[2] = 1/2

    static AnimateOff := true     ; 이동 시 애니메이션 끄기 시도(빠릿하게)
}


; ============================== 상태 =========================================
global gCols    := []   ; strip 위의 창 목록. 각 원소: {hwnd, w, widx}
global gFocus   := 0    ; 현재 포커스된 열의 인덱스(1-based, 0 = 없음)
global gScroll  := 0    ; 뷰포트 스크롤 위치(strip 좌표, px). 0 = 맨 왼쪽
global gWL := 0, gWT := 0, gWR := 0, gWB := 0   ; 작업 영역 좌/상/우/하


; ============================== 단축키 =======================================
; 기본 모디파이어: Win+Alt (#!). 필요하면 아래 키들을 바꿔 쓰세요.
#!Left::   FocusDir(-1)          ; 이전 창으로 포커스
#!Right::  FocusDir(1)           ; 다음 창으로 포커스
#!+Left::  MoveDir(-1)           ; 현재 창을 왼쪽으로 이동
#!+Right:: MoveDir(1)            ; 현재 창을 오른쪽으로 이동
#!Home::   FocusEnd(-1)          ; 맨 왼쪽 창으로
#!End::    FocusEnd(1)           ; 맨 오른쪽 창으로

#!Enter::  CycleWidth()          ; 너비 프리셋 순환(1/3 → 1/2 → 2/3 → 전체)
#!=::      GrowShrink(Config.ResizeStep)    ; 너비 늘이기
#!-::      GrowShrink(-Config.ResizeStep)   ; 너비 줄이기
#!c::      CenterFocused()       ; 포커스 창을 화면 가운데로
#!f::      ToggleFull()          ; 포커스 창을 뷰포트 전체 너비로

#!r::      RetileAll()           ; 현재 모니터의 창을 모두 새로 타일링
#!a::      AddActive()           ; 활성 창을 strip에 추가
#!d::      RemoveActive()        ; 활성 창을 strip에서 제외(원래 위치 유지)
#!/::      ShowHelp()            ; 단축키 도움말

; Win+휠: strip을 좌우로 스크롤(스크롤 느낌)
#WheelDown:: ScrollBy(Config.ScrollStep)
#WheelUp::   ScrollBy(-Config.ScrollStep)


; ============================== 명령 =========================================
FocusDir(dir) {
    global gCols, gFocus
    if !gCols.Length
        return
    SyncFocus()
    n := gFocus + dir
    n := Max(1, Min(gCols.Length, n))
    gFocus := n
    ActivateCol(gFocus)
    Relayout(true)
}

FocusEnd(dir) {
    global gCols, gFocus
    if !gCols.Length
        return
    gFocus := (dir < 0) ? 1 : gCols.Length
    ActivateCol(gFocus)
    Relayout(true)
}

MoveDir(dir) {
    global gCols, gFocus
    if !gCols.Length
        return
    SyncFocus()
    n := gFocus + dir
    if (n < 1 || n > gCols.Length)
        return
    tmp := gCols[gFocus]
    gCols[gFocus] := gCols[n]
    gCols[n] := tmp
    gFocus := n
    ActivateCol(gFocus)
    Relayout(true)
}

CycleWidth() {
    global gCols, gFocus
    if !gCols.Length
        return
    SyncFocus()
    col := gCols[gFocus]
    col.widx := Mod(col.widx, Config.Widths.Length) + 1
    col.w := RatioWidth(Config.Widths[col.widx])
    Relayout(true)
}

GrowShrink(delta) {
    global gCols, gFocus
    if !gCols.Length
        return
    SyncFocus()
    col := gCols[gFocus]
    col.w := Max(Config.MinWidth, Min(ViewW(), col.w + delta))
    col.widx := 0                 ; 사용자 지정 너비(프리셋 아님)
    Relayout(true)
}

ToggleFull() {
    global gCols, gFocus
    if !gCols.Length
        return
    SyncFocus()
    col := gCols[gFocus]
    full := ViewW()
    col.w := (col.w >= full - 2) ? RatioWidth(1/2) : full
    col.widx := 0
    CenterFocused()
}

CenterFocused() {
    global gCols, gFocus, gScroll
    if !gCols.Length
        return
    SyncFocus()
    fL := ColLeft(gFocus)
    gScroll := Round(fL + gCols[gFocus].w / 2 - ViewW() / 2)
    Relayout(false)
}

ScrollBy(delta) {
    global gCols, gScroll
    if !gCols.Length
        return
    gScroll += delta
    Relayout(false)
}

AddActive() {
    global gCols, gFocus
    a := WinExist("A")
    if (!a || !IsTileable(a))
        return
    for col in gCols
        if (col.hwnd = a)
            return                ; 이미 추적 중
    if !gCols.Length
        SetWorkAreaFrom(a)
    col := { hwnd: a, w: 0, widx: Config.DefaultWidth }
    col.w := RatioWidth(Config.Widths[col.widx])
    SyncFocus()
    if (gFocus >= 1) {
        gCols.InsertAt(gFocus + 1, col)
        gFocus += 1
    } else {
        gCols.Push(col)
        gFocus := gCols.Length
    }
    try WinRestore("ahk_id " a)
    Relayout(true)
}

RemoveActive() {
    global gCols, gFocus
    if !gCols.Length
        return
    SyncFocus()
    gCols.RemoveAt(gFocus)
    gFocus := Min(gFocus, gCols.Length)
    if (gFocus >= 1)
        ActivateCol(gFocus)
    Relayout(true)
}

RetileAll() {
    global gCols, gFocus, gScroll
    a := WinExist("A")
    if !a {
        ; 활성 창이 없으면 첫 번째 타일 가능한 창 기준으로
        for hwnd in WinGetList() {
            if IsTileable(hwnd) {
                a := hwnd
                break
            }
        }
    }
    if !a
        return
    SetWorkAreaFrom(a)
    targetMon := MonitorOf(a)

    list := []
    for hwnd in WinGetList() {
        if (IsTileable(hwnd) && MonitorOf(hwnd) = targetMon)
            list.Push(hwnd)
    }
    SortByX(list)

    gCols := []
    gScroll := 0
    for hwnd in list {
        col := { hwnd: hwnd, w: 0, widx: Config.DefaultWidth }
        col.w := RatioWidth(Config.Widths[col.widx])
        try WinRestore("ahk_id " hwnd)
        gCols.Push(col)
    }
    gFocus := gCols.Length ? 1 : 0
    ; 활성 창이 목록에 있으면 그걸 포커스로
    SyncFocus()
    Relayout(true)
    if gCols.Length
        ActivateCol(gFocus)
}


; ============================== 레이아웃 =====================================
Relayout(adjustScroll := true) {
    global gCols, gFocus, gScroll, gWL, gWT, gWB
    if !gCols.Length
        return

    Pad := Config.OuterGap
    Gap := Config.Gap
    viewW := ViewW()
    viewH := (gWB - gWT) - 2 * Pad

    ; 각 열의 strip 좌표(왼쪽 끝) 계산
    xs := []
    cx := 0
    for i, col in gCols {
        xs.Push(cx)
        cx += col.w + Gap
    }
    totalW := cx - Gap            ; 마지막 간격 제거

    ; 포커스 창이 뷰포트에 완전히 보이도록 스크롤 조정
    if (adjustScroll && gFocus >= 1) {
        fL := xs[gFocus]
        fR := fL + gCols[gFocus].w
        if (fL - gScroll < 0)
            gScroll := fL
        else if (fR - gScroll > viewW)
            gScroll := fR - viewW
    }

    ; 스크롤 범위 제한
    maxScroll := Max(0, totalW - viewW)
    gScroll := Max(0, Min(maxScroll, gScroll))

    ; 실제 배치
    for i, col in gCols {
        if !WinExist("ahk_id " col.hwnd) {
            ; 닫힌 창은 다음 정리 때 제거 표시
            col.hwnd := 0
            continue
        }
        sx := gWL + Pad + xs[i] - gScroll
        sy := gWT + Pad
        PlaceWindow(col.hwnd, sx, sy, col.w, viewH)
    }
    PruneClosed()
}

; 닫힌 창(hwnd=0)을 목록에서 제거
PruneClosed() {
    global gCols, gFocus
    cleaned := []
    for col in gCols {
        if (col.hwnd && WinExist("ahk_id " col.hwnd))
            cleaned.Push(col)
    }
    if (cleaned.Length != gCols.Length) {
        gCols := cleaned
        gFocus := Max(1, Min(gFocus, gCols.Length))
    }
}


; ============================== 헬퍼 =========================================
ViewW() {
    global gWL, gWR
    return (gWR - gWL) - 2 * Config.OuterGap
}

RatioWidth(ratio) {
    return Round(ViewW() * ratio)
}

; strip 좌표에서 idx번째 열의 왼쪽 끝
ColLeft(idx) {
    global gCols
    x := 0
    for i, col in gCols {
        if (i = idx)
            return x
        x += col.w + Config.Gap
    }
    return x
}

ActivateCol(idx) {
    global gCols
    if (idx >= 1 && idx <= gCols.Length)
        try WinActivate("ahk_id " gCols[idx].hwnd)
}

; 활성 창이 strip 안에 있으면 gFocus를 그 창으로 동기화
SyncFocus() {
    global gCols, gFocus
    a := WinExist("A")
    for i, col in gCols {
        if (col.hwnd = a) {
            gFocus := i
            return true
        }
    }
    return false
}

; 창을 (X, Y, W, H) "보이는 프레임" 기준으로 배치(투명 테두리 보정 포함)
PlaceWindow(hwnd, X, Y, W, H) {
    GetFrameOffsets(hwnd, &ol, &ot, &or, &ob)
    try WinMove(X - ol, Y - ot, W + ol + or, H + ot + ob, "ahk_id " hwnd)
}

; DWM이 그리는 투명 리사이즈 테두리 두께를 구한다(좌/상/우/하)
GetFrameOffsets(hwnd, &ol, &ot, &or, &ob) {
    ol := ot := or := ob := 0
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
    ol := fl - wl, ot := ft - wt, or := wr - fr, ob := wb - fbm
}

; 작업 영역을 hwnd가 있는 모니터 기준으로 설정
SetWorkAreaFrom(hwnd) {
    global gWL, gWT, gWR, gWB
    GetMonitorWorkArea(hwnd, &gWL, &gWT, &gWR, &gWB)
}

GetMonitorWorkArea(hwnd, &L, &T, &R, &B) {
    ; MONITOR_DEFAULTTONEAREST = 2
    hMon := DllCall("MonitorFromWindow", "ptr", hwnd, "uint", 2, "ptr")
    mi := Buffer(40, 0)
    NumPut("uint", 40, mi, 0)     ; cbSize
    DllCall("GetMonitorInfo", "ptr", hMon, "ptr", mi)
    ; rcWork = offset 20..36
    L := NumGet(mi, 20, "int")
    T := NumGet(mi, 24, "int")
    R := NumGet(mi, 28, "int")
    B := NumGet(mi, 32, "int")
}

MonitorOf(hwnd) {
    return DllCall("MonitorFromWindow", "ptr", hwnd, "uint", 2, "ptr")
}

; 타일링 대상이 되는 "보통의" 최상위 창인지 판단
IsTileable(hwnd) {
    if !WinExist("ahk_id " hwnd)
        return false
    if (WinGetTitle("ahk_id " hwnd) = "")
        return false
    style   := WinGetStyle("ahk_id " hwnd)
    exStyle := WinGetExStyle("ahk_id " hwnd)
    if !(style & 0x10000000)          ; WS_VISIBLE
        return false
    if !(style & 0x00C00000)          ; WS_CAPTION (제목 표시줄 있음)
        return false
    if (exStyle & 0x00000080)         ; WS_EX_TOOLWINDOW
        return false
    if (WinGetMinMax("ahk_id " hwnd) = -1)   ; 최소화됨
        return false
    if IsCloaked(hwnd)                ; 숨겨진 UWP/가상 데스크톱 창
        return false
    cls := WinGetClass("ahk_id " hwnd)
    static skip := Map(
        "Progman", 1, "WorkerW", 1, "Shell_TrayWnd", 1,
        "Windows.UI.Core.CoreWindow", 1, "ApplicationFrameWindow", 0)
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

; hwnd 목록을 현재 화면상의 X좌표 오름차순으로 정렬(삽입 정렬, N 작음)
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
        cur := list[i]
        j := i - 1
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

[ 시작 ]
  Win+Alt+R        현재 모니터 창 전부 타일링
  Win+Alt+A        활성 창을 띠에 추가
  Win+Alt+D        활성 창을 띠에서 제외

[ 이동 / 포커스 ]
  Win+Alt+←/→      이전 / 다음 창으로
  Win+Alt+Home/End 맨 왼쪽 / 맨 오른쪽 창으로
  Win+Alt+Shift+←/→  현재 창을 좌 / 우로 이동
  Win+(마우스 휠)   띠를 좌우로 스크롤

[ 크기 ]
  Win+Alt+Enter    너비 순환(1/3 → 1/2 → 2/3 → 전체)
  Win+Alt+= / -    너비 늘이기 / 줄이기
  Win+Alt+F        뷰포트 전체 너비 토글
  Win+Alt+C        화면 가운데로 정렬

  Win+Alt+/        이 도움말
)"
    MsgBox(txt, "ScrollWM 도움말", "Iconi")
}


; ============================== 트레이 =======================================
TraySetIcon("shell32.dll", 264)
A_TrayMenu.Delete()
A_TrayMenu.Add("도움말 (Win+Alt+/)", (*) => ShowHelp())
A_TrayMenu.Add("전체 타일링 (Win+Alt+R)", (*) => RetileAll())
A_TrayMenu.Add()
A_TrayMenu.Add("스크립트 재시작", (*) => Reload())
A_TrayMenu.Add("종료", (*) => ExitApp())
A_TrayMenu.Default := "도움말 (Win+Alt+/)"
TrayTip("ScrollWM 실행됨\nWin+Alt+R 로 타일링 시작, Win+Alt+/ 로 도움말", "ScrollWM", "Mute")
