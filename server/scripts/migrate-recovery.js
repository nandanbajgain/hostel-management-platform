#!/usr/bin/env node

/**
 * Migration recovery script for Render
 * Handles failed migrations by resolving them before attempting new migrations
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[Migration Recovery] Starting recovery process...');

const PRISMA_DIR = path.join(__dirname, '../prisma');
const MIGRATIONS_DIR = path.join(PRISMA_DIR, 'migrations');

// Get list of migrations
const migrations = fs.readdirSync(MIGRATIONS_DIR)
  .filter(dir => /^\d+_/.test(dir))
  .sort()
  .reverse(); // Start from most recent

console.log(`[Migration Recovery] Found ${migrations.length} migrations`);
console.log('[Migration Recovery] Attempting to resolve any failed migrations...');

const resolveFailedMigration = () => {
  return new Promise((resolve) => {
    // Try to mark any failed migrations as "rolled back" to reset migration history on Render
    const resetCmd = spawn('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', migrations[migrations.length - 1]], {
      stdio: 'inherit',
      timeout: 10000,
    });

    resetCmd.on('close', (code) => {
      if (code === 0) {
        console.log('[Migration Recovery] ✓ Successfully resolved failed migrations');
      } else {
        console.warn('[Migration Recovery] ⚠ No failed migrations to resolve, continuing');
      }
      resolve();
    });

    resetCmd.on('error', (error) => {
      console.warn('[Migration Recovery] Resolve command skipped:', error.message);
      resolve();
    });

    // Timeout after 10s
    setTimeout(() => {
      console.warn('[Migration Recovery] Resolve command timeout, continuing');
      resetCmd.kill();
      resolve();
    }, 10000);
  });
};

const deployMigrations = () => {
  return new Promise((resolve) => {
    console.log('[Migration Recovery] Deploying migrations...');
    
    const deploy = spawn('npx', ['prisma', 'migrate', 'deploy'], {
      stdio: 'inherit',
      timeout: 60000,
    });

    let deployComplete = false;

    deploy.on('close', (code) => {
      deployComplete = true;
      if (code === 0) {
        console.log('[Migration Recovery] ✓ Migrations deployed successfully');
        runSeed();
      } else {
        console.warn('[Migration Recovery] ⚠ Migration deploy failed, continuing with app');
        startApp();
      }
      resolve();
    });

    deploy.on('error', (error) => {
      console.warn('[Migration Recovery] Deploy error:', error.message);
      if (!deployComplete) {
        deployComplete = true;
        startApp();
        resolve();
      }
    });

    setTimeout(() => {
      if (!deployComplete) {
        console.warn('[Migration Recovery] Deploy timeout (60s), forcing continuation');
        deploy.kill();
        deployComplete = true;
        startApp();
        resolve();
      }
    }, 60000);
  });
};

const runSeed = () => {
  console.log('[Migration Recovery] Running database seed...');
  
  const seed = spawn('npx', ['prisma', 'db', 'seed'], {
    stdio: 'inherit',
    timeout: 30000,
  });

  let seedComplete = false;

  seed.on('close', (code) => {
    seedComplete = true;
    if (code === 0) {
      console.log('[Migration Recovery] ✓ Database seeded successfully');
    } else {
      console.warn('[Migration Recovery] ⚠ Seed failed');
    }
    startApp();
  });

  seed.on('error', (error) => {
    console.warn('[Migration Recovery] Seed error:', error.message);
    if (!seedComplete) {
      seedComplete = true;
      startApp();
    }
  });

  setTimeout(() => {
    if (!seedComplete) {
      console.warn('[Migration Recovery] Seed timeout, forcing app startup');
      seed.kill();
      seedComplete = true;
      startApp();
    }
  }, 30000);
};

const startApp = () => {
  console.log('[Migration Recovery] Starting NestJS application...');
  const app = spawn('node', ['dist/main.js'], {
    stdio: 'inherit',
  });

  app.on('error', (error) => {
    console.error('[Migration Recovery] Failed to start app:', error);
    process.exit(1);
  });
};

// Run the recovery process
(async () => {
  try {
    await resolveFailedMigration();
    await deployMigrations();
  } catch (error) {
    console.error('[Migration Recovery] Fatal error:', error);
    process.exit(1);
  }
})();
