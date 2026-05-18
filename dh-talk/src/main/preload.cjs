// Electron preload 는 sandbox 환경에서 동작해야 하므로 CommonJS(.cjs)로 작성한다.
// 프로젝트 기본 모듈 형식은 ESM 이지만 preload 는 불가피한 예외 (CLAUDE.md §13).
const { contextBridge, ipcRenderer } = require('electron');

// renderer 의 window.dhtalk 으로만 main 기능에 접근. nodeIntegration 은 꺼져 있다.
contextBridge.exposeInMainWorld('dhtalk', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  getMacros: () => ipcRenderer.invoke('config:get-macros'),
  getSettings: () => ipcRenderer.invoke('config:get-settings'),
  getUsers: () => ipcRenderer.invoke('config:get-users'),

  getRecentMessages: () => ipcRenderer.invoke('messages:recent'),
  searchMessages: (query) => ipcRenderer.invoke('messages:search', query),
  getDiagnostics: () => ipcRenderer.invoke('app:get-diagnostics'),

  // 환자 큐 — 변경 작업은 갱신된 큐 목록을 반환한다.
  listPatients: () => ipcRenderer.invoke('patients:list'),
  bulkAddPatients: (text) => ipcRenderer.invoke('patients:bulk-add', text),
  addWalkin: (name) => ipcRenderer.invoke('patients:add-walkin', name),
  advancePatients: () => ipcRenderer.invoke('patients:advance'),
  clearPatients: () => ipcRenderer.invoke('patients:clear'),

  // 펄스 알람 — 메인 창이 알람 창 표시/종료를 요청.
  showAlert: (msg) => ipcRenderer.send('alert:show', msg),
  closeAlert: () => ipcRenderer.send('alert:close'),

  // config/macros.yaml 핫리로드 시 main 이 push. 해제 함수를 반환한다.
  onMacrosChanged: (callback) => {
    const listener = (_event, macros) => callback(macros);
    ipcRenderer.on('config:macros-changed', listener);
    return () => ipcRenderer.removeListener('config:macros-changed', listener);
  },

  // 자정 환자 큐 리셋 알림.
  onPatientsReset: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('patients:reset', listener);
    return () => ipcRenderer.removeListener('patients:reset', listener);
  },

  // 알람 창의 "확인" 결과 — 메인 창이 WS 로 ack 를 보내야 한다.
  onAlertAcked: (callback) => {
    const listener = (_event, msg) => callback(msg);
    ipcRenderer.on('alert:acked', listener);
    return () => ipcRenderer.removeListener('alert:acked', listener);
  },

  // 알람 창의 에스컬레이션 요청 — 메인 창이 WS 로 escalate 를 보내야 한다.
  onAlertEscalateRequest: (callback) => {
    const listener = (_event, msg) => callback(msg);
    ipcRenderer.on('alert:escalate-request', listener);
    return () => ipcRenderer.removeListener('alert:escalate-request', listener);
  },
});
