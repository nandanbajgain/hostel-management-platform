#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const candidates = [
  path.join(projectRoot, 'dist', 'seed.js'),
  path.join(projectRoot, 'dist', 'prisma', 'seed.js'),
];

const entry = candidates.find((p) => fs.existsSync(p));

if (!entry) {
  console.error('[prisma:seed] Could not find compiled seed script.');
  console.error('[prisma:seed] Looked for:');
  for (const candidate of candidates) console.error('  - ' + candidate);
  console.error('[prisma:seed] Ensure you ran `npm run build` and that it compiles `prisma/seed.ts`.');
  process.exit(1);
}

const child = spawn(process.execPath, [entry], { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

