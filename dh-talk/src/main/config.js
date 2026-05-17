import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import chokidar from 'chokidar';

// config/*.yaml 로더. 사용자가 메모장으로 편집하므로 chokidar 로 핫리로드한다.

function readYaml(file, fallback) {
  try {
    return parse(fs.readFileSync(file, 'utf8')) ?? fallback;
  } catch (err) {
    console.error(`[config] ${path.basename(file)} 로드 실패:`, err.message);
    return fallback;
  }
}

export function loadConfig(configDir) {
  return {
    macros: readYaml(path.join(configDir, 'macros.yaml'), { macros: [] }).macros ?? [],
    settings: readYaml(path.join(configDir, 'settings.yaml'), {}),
    users: readYaml(path.join(configDir, 'users.yaml'), { users: [] }).users ?? [],
  };
}

export function watchConfig(configDir, onChange) {
  const watcher = chokidar.watch(configDir, { ignoreInitial: true });
  const reload = (file) => {
    console.log(`[config] 변경 감지: ${path.basename(file)} — 다시 로드`);
    onChange(loadConfig(configDir));
  };
  watcher.on('change', reload).on('add', reload).on('unlink', reload);
  return watcher;
}
