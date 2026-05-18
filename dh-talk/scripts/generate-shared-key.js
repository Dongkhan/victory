#!/usr/bin/env node
// WebSocket 인증용 shared key 를 생성한다 (개선분석 2차 3순위).
// 4대 PC(데스크1/2/3/원장)의 config/settings.yaml auth.shared_key 에 동일 입력.
import { randomBytes } from 'node:crypto';

const key = randomBytes(32).toString('base64url');

process.stdout.write(`${key}\n`);
process.stderr.write(
  '\n위 키를 4대 PC(데스크1/2/3/원장)의 config/settings.yaml\n' +
    'auth.shared_key 에 모두 동일하게 입력하세요.\n',
);
