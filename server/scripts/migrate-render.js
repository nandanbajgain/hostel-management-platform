#!/usr/bin/env node

/**
 * Migration wrapper for Render deployment
 * Attempts to resolve failed migrations and run migrations with timeout handling
 * If migrations fail/timeout, continues with app startup
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('[Render Migration] Starting migration process...');
console.log('[Render Migration] Environment: NODE_ENV=' + process.env.NODE_ENV);
console.log('[Render Migration] Current working directory:', process.cwd());

let migrationComplete = false;
let migrationSuccess = false;

const MIGRATION_TO_RESOLVE = '20260407_professional_counselling';

// Step 1: Try to resolve any failed migrations
const resolveFailedMigrations = new Promise((resolve) => {
  console.log('[Render Migration] Step 1: Attempting to resolve any failed migrations...');
  
  const resolve_cmd = spawn('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', MIGRATION_TO_RESOLVE], {
    stdio: 'inherit',
    shell: true,
  });

  const resolveTimeout = setTimeout(() => {
    console.warn('[Render Migration] Resolve command timeout, skipping');
    resolve_cmd.kill();
    resolve();
  }, 15000);

  resolve_cmd.on('close', (code) => {
    clearTimeout(resolveTimeout);
    if (code === 0 || code === 1) { // 0 = success, 1 = already resolved/no failed migrations
      console.log('[Render Migration] [OK] Ready to deploy migrations');
    } else {
      console.warn('[Render Migration] ⚠ Resolve returned code', code);
    }
    resolve();
  });

  resolve_cmd.on('error', (err) => {
    clearTimeout(resolveTimeout);
    console.warn('[Render Migration] Resolve error:', err.message);
    resolve();
  });
});

// Step 2: Deploy migrations
resolveFailedMigrations.then(() => {
  console.log('[Render Migration] Step 2: Deploying migrations...');
  console.log('[Render Migration] Working directory:', process.cwd());
  
  const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    shell: true,
  });

  const migrateTimeout = setTimeout(() => {
    console.warn('[Render Migration] Migration deploy timeout (30s), forcing app startup');
    migrate.kill();
    migrationComplete = true;
    startApp();
  }, 30000);

  migrate.on('close', (code) => {
    clearTimeout(migrateTimeout);
    migrationComplete = true;
    migrationSuccess = code === 0;
    
    if (migrationSuccess) {
      console.log('[Render Migration] [OK] Migrations applied successfully');
      runSeed();
    } else {
      console.warn('[Render Migration] ⚠ Migrations failed with code ' + code + ', continuing with app startup');
      startApp();
    }
  });

  migrate.on('error', (error) => {
    clearTimeout(migrateTimeout);
    console.warn('[Render Migration] Migration process error:', error.message);
    migrationComplete = true;
    startApp();
  });
});

function runSeed() {
  console.log('[Render Migration] Step 3: Running database seed...');
  
  const seed = spawn('npx', ['prisma', 'db', 'seed'], {
    stdio: 'inherit',
    shell: true,
  });

  const seedTimeout = setTimeout(() => {
    console.warn('[Render Migration] Seed timeout (15s), forcing app startup');
    seed.kill();
    startApp();
  }, 15000);

  seed.on('close', (code) => {
    clearTimeout(seedTimeout);
    if (code === 0) {
      console.log('[Render Migration] [OK] Database seeded successfully');
    } else {
      console.warn('[Render Migration] ⚠ Seed failed with code ' + code);
    }
    startApp();
  });

  seed.on('error', (error) => {
    clearTimeout(seedTimeout);
    console.warn('[Render Migration] Seed error:', error.message);
    startApp();
  });
}

function startApp() {
  console.log('[Render Migration] Starting NestJS application...');
  console.log('[Render Migration] Current working directory:', process.cwd());
  console.log('[Render Migration] Executing: npm run start:prod');
  
  const app = spawn('npm', ['run', 'start:prod'], {
    stdio: 'inherit',
    shell: true,
  });

  app.on('error', (error) => {
    console.error('[Render Migration] Failed to start app:', error);
    process.exit(1);
  });
}
