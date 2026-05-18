import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

// renderer(UI)만 Vite 가 빌드한다. main process 는 Electron 이 직접 실행.
// 두 개의 페이지: 메인 창(index.html) + 펄스 알람 창(alert.html).
export default defineConfig({
  root: 'src/renderer',
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // src/shared (root 밖) 의 모듈을 dev 서버가 제공할 수 있도록 허용
    fs: { allow: [dir] },
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(dir, 'src/renderer/index.html'),
        alert: path.resolve(dir, 'src/renderer/alert.html'),
      },
    },
  },
});
