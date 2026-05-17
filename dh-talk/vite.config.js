import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// renderer(UI)만 Vite 가 빌드한다. main process 는 Electron 이 직접 실행.
// base: './' — 패키징 후 file:// 로드 시 상대경로가 필요.
export default defineConfig({
  root: 'src/renderer',
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
});
