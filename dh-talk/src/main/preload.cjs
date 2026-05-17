// Electron preload 는 sandbox 환경에서 동작해야 하므로 CommonJS(.cjs)로 작성한다.
// 프로젝트 기본 모듈 형식은 ESM 이지만 preload 는 불가피한 예외 (CLAUDE.md §13).
const { contextBridge, ipcRenderer } = require('electron');

// renderer 의 window.dhtalk 으로만 main 기능에 접근. nodeIntegration 은 꺼져 있다.
contextBridge.exposeInMainWorld('dhtalk', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  getMacros: () => ipcRenderer.invoke('config:get-macros'),
  getSettings: () => ipcRenderer.invoke('config:get-settings'),
  getUsers: () => ipcRenderer.invoke('config:get-users'),

  // 환자 큐 — 변경 작업은 갱신된 큐 목록을 반환한다.
  listPatients: () => ipcRenderer.invoke('patients:list'),
  bulkAddPatients: (text) => ipcRenderer.invoke('patients:bulk-add', text),
  addWalkin: (name) => ipcRenderer.invoke('patients:add-walkin', name),
  advancePatients: () => ipcRenderer.invoke('patients:advance'),
  clearPatients: () => ipcRenderer.invoke('patients:clear'),

  // config/macros.yaml 핫리로드 시 main 이 push. 해제 함수를 반환한다.
  onMacrosChanged: (callback) => {
    const listener = (_event, macros) => callback(macros);
    ipcRenderer.on('config:macros-changed', listener);
    return () => ipcRenderer.removeListener('config:macros-changed', listener);
  },
});
