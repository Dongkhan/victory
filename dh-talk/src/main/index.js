import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WS_PORT } from '../shared/types.js';
import { startServer, stopServer } from './server.js';
import { registerIpc } from './ipc.js';
import { initDb, closeDb } from './db.js';
import { loadConfig, watchConfig } from './config.js';

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

let mainWindow = null;
let config = { macros: [], settings: {}, users: [] };
let configWatcher = null;

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

app.whenReady().then(() => {
  initDb(path.join(dataDir, 'messages.db'));

  config = loadConfig(configDir);
  configWatcher = watchConfig(configDir, (next) => {
    config = next;
    mainWindow?.webContents.send('config:macros-changed', config.macros);
  });

  // WebSocket 허브는 데스크1(is_server) PC 에서만 기동한다.
  const meUser = config.users.find((u) => u.id === config.settings.me);
  if (meUser?.is_server) {
    startServer(WS_PORT);
  } else {
    console.log(`[main] 이 PC(${config.settings.me})는 서버가 아님 — 허브 미기동`);
  }

  registerIpc(() => config);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  configWatcher?.close();
  stopServer();
  closeDb();
});
