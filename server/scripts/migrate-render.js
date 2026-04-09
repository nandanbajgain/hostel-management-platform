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
    runSeed();
  } else {
    console.warn('[Migration Wrapper] ⚠ Migrations failed or timed out, continuing with startup');
    startApp();
  }
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

function runSeed() {
  console.log('[Migration Wrapper] Running database seed...');
  
  const seed = spawn('npx', ['prisma', 'db', 'seed'], {
    stdio: 'inherit',
    timeout: 15000, // 15 second timeout for seed
  });

  seed.on('close', (code) => {
    if (code === 0) {
      console.log('[Migration Wrapper] ✓ Database seeded successfully');
    } else {
      console.warn('[Migration Wrapper] ⚠ Seed failed, continuing with startup');
    }
    startApp();
  });

  seed.on('error', (error) => {
    console.warn('[Migration Wrapper] Seed error:', error.message);
    startApp();
  });

  // Force app startup after seed timeout
  setTimeout(() => {
    console.warn('[Migration Wrapper] ⚠ Seed timeout (15s), forcing app startup');
    seed.kill();
    startApp();
  }, 15000);
}

function startApp() {
  console.log('[Migration Wrapper] Starting NestJS application...');
  const app = spawn('node', ['dist/main'], {
    stdio: 'inherit',
  });

  app.on('error', (error) => {
    console.error('[Migration Wrapper] Failed to start app:', error);
    process.exit(1);
  });
}
