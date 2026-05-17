// 펄스 알람 창 전용 preload. (CommonJS — sandbox preload 제약, CLAUDE.md §13)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dhtalkAlert', {
  // main 이 보내는 알람 데이터 구독. 해제 함수를 반환한다.
  onData: (callback) => {
    const listener = (_event, msg) => callback(msg);
    ipcRenderer.on('alert:data', listener);
    return () => ipcRenderer.removeListener('alert:data', listener);
  },
  ack: (msg) => ipcRenderer.send('alert:ack', msg),
  escalate: (msg) => ipcRenderer.send('alert:escalate', msg),
});
