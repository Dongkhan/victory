import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WS_PORT } from '../shared/types.js';
import { startServer, stopServer } from './server.js';
import { registerIpc } from './ipc.js';
import { initDb, closeDb, clearPatients } from './db.js';
import { loadConfig, watchConfig } from './config.js';
import { configureAlertWindow, showAlert, closeAlert } from './alert-window.js';
import { runCleanup, scheduleDailyAt } from './cleanup.js';
import { loadEnv } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const DEV_SERVER_URL = 'http://localhost:5173';

// dev: 프로젝트 폴더 내 data/, config/
// packaged: 사용자 문서 폴더(쓰기 가능) + resources/config
const dataDir = app.isPackaged
  ? path.join(app.getPath('documents'), 'DH Talk')
  : path.join(projectRoot, 'data');
const configDir = app.isPackaged
  ? path.join(process.resourcesPath, 'config')
  : path.join(projectRoot, 'config');
const attachmentsDir = path.join(dataDir, 'attachments');

let mainWindow = null;
let config = { macros: [], settings: {}, users: [] };
let configWatcher = null;
const scheduled = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 560,
    title: 'DH Talk',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(projectRoot, 'dist', 'renderer', 'index.html'));
  } else {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 펄스 알람 창 ↔ 메인 창 IPC 중계.
function wireAlertIpc() {
  ipcMain.on('alert:show', (_e, msg) => showAlert(msg));
  ipcMain.on('alert:close', () => closeAlert());

  // 알람 창의 "확인" → 알람 닫고, 메인 창이 ack 를 WS 로 보내도록 전달.
  ipcMain.on('alert:ack', (_e, msg) => {
    closeAlert();
    mainWindow?.webContents.send('alert:acked', msg);
  });

  // 알람 창의 60초 미확인 → 메인 창이 escalate 를 WS 로 보내도록 전달.
  ipcMain.on('alert:escalate', (_e, msg) => {
    mainWindow?.webContents.send('alert:escalate-request', msg);
  });
}

app.whenReady().then(() => {
  // .env 로드 (HERMES_URL, DHTALK_API_KEY) — Hermes 미러링용.
  loadEnv(path.join(app.isPackaged ? process.resourcesPath : projectRoot, '.env'));

  initDb(path.join(dataDir, 'messages.db'));

  config = loadConfig(configDir);
  configWatcher = watchConfig(configDir, (next) => {
    config = next;
    mainWindow?.webContents.send('config:macros-changed', config.macros);
  });

  // WebSocket 허브는 데스크1(is_server) PC 에서만 기동한다.
  const meUser = config.users.find((u) => u.id === config.settings.me);
  if (meUser?.is_server) {
    startServer(WS_PORT, {
      attachmentsDir,
      // 핫리로드 반영을 위해 getter 로 전달
      getSecurity: () => ({
        sharedKey: config.settings.auth?.shared_key || '',
        userIds: config.users.map((u) => u.id),
      }),
    });
  } else {
    console.log(`[main] 이 PC(${config.settings.me})는 서버가 아님 — 허브 미기동`);
  }

  registerIpc(() => config);
  configureAlertWindow({ isPackaged: app.isPackaged, devUrl: DEV_SERVER_URL, projectRoot });
  wireAlertIpc();
  createWindow();

  // 정기 작업: 02:00 메시지/첨부 30일 정리, 00:00 환자 큐 리셋 (CLAUDE.md §11, §9).
  scheduled.push(scheduleDailyAt(2, () => runCleanup(attachmentsDir)));
  scheduled.push(
    scheduleDailyAt(0, () => {
      clearPatients();
      mainWindow?.webContents.send('patients:reset');
    }),
  );

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  scheduled.forEach((cancel) => cancel());
  configWatcher?.close();
  stopServer();
  closeAlert();
  closeDb();
});
