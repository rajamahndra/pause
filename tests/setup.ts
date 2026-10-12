import 'dotenv/config';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
export default async function setup() {
  const database = new URL(process.env.DATABASE_URL || '');
  if (!database.pathname.endsWith('_test')) throw new Error('Tests require a dedicated database ending in _test.');
  const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
  try {
    await fetch(origin + '/api/v1/health', { signal: AbortSignal.timeout(1000) });
    throw new Error('Test port is already in use. Choose another APP_ORIGIN.');
  } catch (error) {
    if ((error as Error).message.startsWith('Test port')) throw error;
  }
  const logfile = fs.openSync('tests/server.log', 'w');
  const server = spawn(process.execPath, [path.resolve('node_modules/next/dist/bin/next'), 'start', '-p', new URL(origin).port || '3000'], { windowsHide: true, stdio: ['ignore', logfile, logfile], env: process.env });
  fs.closeSync(logfile);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(origin + '/api/v1/health', { signal: AbortSignal.timeout(1000) });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) {
    server.kill();
    throw new Error('Production test server failed; see tests/server.log.');
  }
  return async () => {
    server.kill();
    await new Promise<void>((resolve) => {
      if (server.exitCode !== null) resolve();
      else {
        server.once('exit', () => resolve());
        setTimeout(() => {
          server.kill('SIGKILL');
          resolve();
        }, 3000).unref();
      }
    });
  };
}
