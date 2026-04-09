#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const candidates = [
  path.join(projectRoot, 'dist', 'main.js'),
  path.join(projectRoot, 'dist', 'main'),
  path.join(projectRoot, 'dist', 'src', 'main.js'),
  path.join(projectRoot, 'dist', 'src', 'main'),
];

const entry = candidates.find((p) => fs.existsSync(p));

if (!entry) {
  console.error('[start:prod] Could not find compiled Nest entrypoint.');
  console.error('[start:prod] Looked for:');
  for (const candidate of candidates) console.error('  - ' + candidate);
  console.error('[start:prod] Ensure you ran `npm run build` and that it outputs to `dist/`.');
  process.exit(1);
}

const child = spawn(process.execPath, [entry], { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

