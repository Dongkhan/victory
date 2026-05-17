import { ipcMain, app } from 'electron';
import { WS_PORT } from '../shared/types.js';

// renderer ↔ main IPC 핸들러 등록.
// getConfig: 현재 로드된 config 객체를 돌려주는 함수 (핫리로드 반영).

export function registerIpc(getConfig) {
  ipcMain.handle('app:get-info', () => ({
    name: 'DH Talk',
    version: app.getVersion(),
    platform: process.platform,
    wsPort: WS_PORT,
  }));

  ipcMain.handle('config:get-macros', () => getConfig().macros);
  ipcMain.handle('config:get-settings', () => getConfig().settings);
  ipcMain.handle('config:get-users', () => getConfig().users);
}
