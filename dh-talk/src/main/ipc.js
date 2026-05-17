import { ipcMain, app } from 'electron';
import { WS_PORT } from '../shared/types.js';

// renderer ↔ main IPC 핸들러 등록.
// Day 1 은 앱 정보 조회 채널 하나만. Day 4 부터 메시지/큐/DB 채널이 추가된다.

export function registerIpc() {
  ipcMain.handle('app:get-info', () => ({
    name: 'DH Talk',
    version: app.getVersion(),
    platform: process.platform,
    wsPort: WS_PORT,
  }));
}
