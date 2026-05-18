import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 펄스 알람 — 별도 BrowserWindow (CLAUDE.md §8).
// always-on-top·non-focusable·skip-taskbar 라 다른 창의 포커스/입력을 가로채지 않는다.

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let alertWin = null;
let alertUrgent = false;
let target = null; // { isPackaged, devUrl, projectRoot }

export function configureAlertWindow(loadTarget) {
  target = loadTarget;
}

function createAlertWindow(urgent) {
  const area = screen.getPrimaryDisplay().workArea;
  const bounds = urgent
    ? { x: area.x, y: area.y, width: area.width, height: area.height }
    : { x: area.x + area.width - 356, y: area.y + 16, width: 340, height: 132 };

  const win = new BrowserWindow({
    ...bounds,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    focusable: false, // 키보드 포커스를 절대 가져가지 않음
    show: false,
    transparent: !urgent,
    backgroundColor: urgent ? '#7f1d1d' : '#00000000',
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'alert-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required', // 미확인 사운드 재생용
    },
  });

  win.setAlwaysOnTop(true, 'floating');
  win.setSkipTaskbar(true);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    const allowedDev = target?.devUrl && (url === `${target.devUrl}/alert.html` || url.startsWith(`${target.devUrl}/`));
    if (!url.startsWith('file://') && !allowedDev) event.preventDefault();
  });

  if (target.isPackaged) {
    win.loadFile(path.join(target.projectRoot, 'dist', 'renderer', 'alert.html'));
  } else {
    win.loadURL(`${target.devUrl}/alert.html`);
  }

  win.on('closed', () => {
    alertWin = null;
  });
  return win;
}

export function showAlert(msg) {
  const urgent = msg.alert_level === 'urgent';

  // 긴급/일반은 창 크기가 다르므로 종류가 바뀌면 새로 만든다.
  if (alertWin && alertUrgent !== urgent) {
    alertWin.destroy();
    alertWin = null;
  }
  if (!alertWin) {
    alertWin = createAlertWindow(urgent);
    alertUrgent = urgent;
  }

  const win = alertWin;
  const deliver = () => {
    if (win.isDestroyed()) return;
    win.showInactive(); // 포커스를 주지 않고 표시
    win.setAlwaysOnTop(true, 'floating');
    win.webContents.send('alert:data', msg);
  };

  if (win.webContents.isLoading()) {
    win.webContents.once('did-finish-load', deliver);
  } else {
    deliver();
  }
}

export function closeAlert() {
  if (alertWin) {
    alertWin.destroy();
    alertWin = null;
  }
}
