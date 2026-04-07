#!/usr/bin/env node

/**
 * Migration wrapper for Render deployment
 * Attempts to run migrations with timeout handling
 * If migrations fail/timeout, continues with app startup
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('[Migration Wrapper] Starting migration attempt...');

const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  timeout: 30000, // 30 second timeout
});

let migrationComplete = false;
let migrationSuccess = false;

migrate.on('close', (code) => {
  migrationComplete = true;
  migrationSuccess = code === 0;
  
  if (migrationSuccess) {
    console.log('[Migration Wrapper] ✓ Migrations applied successfully');
  } else {
    console.warn('[Migration Wrapper] ⚠ Migrations failed or timed out, continuing with startup');
  }
  
  startApp();
});

migrate.on('error', (error) => {
  console.warn('[Migration Wrapper] Migration process error:', error.message);
  migrationComplete = true;
  startApp();
});

// Force app startup after timeout if migration hangs
setTimeout(() => {
  if (!migrationComplete) {
    console.warn('[Migration Wrapper] ⚠ Migration timeout (30s), forcing app startup');
    migrate.kill();
    migrationComplete = true;
    startApp();
  }
}, 30000);

function startApp() {
  console.log('[Migration Wrapper] Starting Next.js application...');
  const app = spawn('node', ['dist/src/main'], {
    stdio: 'inherit',
  });

  app.on('error', (error) => {
    console.error('[Migration Wrapper] Failed to start app:', error);
    process.exit(1);
  });
}
