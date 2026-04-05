# Setup Guide

This folder is for teammates who want to run, understand, and extend the project on their own machine.

Read these files in order:

1. `README.md`
2. `QUICKSTART.md`
3. `TROUBLESHOOTING.md`

## What This Project Is

Hostel Management Platform is a monorepo with:

- `client`: React + Vite frontend
- `server`: NestJS + Prisma backend

The app currently includes:

- role-based login
- student, warden, and admin dashboards
- room viewing and room management
- named complaints
- anonymous complaints
- complaint tracking by token
- image upload flow
- chatbot UI and backend endpoint
- real-time notification wiring

## Repository Structure

```text
hostel-platform/
├── client/
├── server/
├── setup/
│   ├── README.md
│   ├── QUICKSTART.md
│   └── TROUBLESHOOTING.md
└── README.md
```

## Important Current Notes

- The project currently uses PostgreSQL.
- The Prisma schema has been adjusted to avoid `pgvector` being required locally.
- `KnowledgeBase.embedding` is currently stored as `String?` in the schema instead of a vector type.
- Redis is configured in environment variables, but it is not required for the main local login flow.
- Cloudinary, Gemini, and Anthropic keys are optional for basic local startup, but related features may fail without them.

## Core Local Requirements

Each teammate needs:

- Node.js
- npm
- PostgreSQL

Recommended versions:

- Node.js 20+
- npm 10+
- PostgreSQL 15+ or newer

## Local Ports

Default ports used by the project:

- frontend: `5173`
- backend: `3001`
- PostgreSQL: `5432`
- Redis: `6379`

## Environment Files

### Server

Path:

```text
server/.env
```

Expected values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hostel_platform"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="hostel-jwt-secret-change-in-prod-2026"
JWT_REFRESH_SECRET="hostel-refresh-secret-change-in-prod-2026"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_CHAT_MODEL="gemini-1.5-flash"
GEMINI_EMBED_MODEL=""
GEMINI_API_BASE_URL="https://generativelanguage.googleapis.com"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
HASH_SALT="sau-hostel-anon-salt-2026"
HOSTEL_NAME="SAU International Hostel"
PORT=3001
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### Client

Path:

```text
client/.env
```

Expected values:

```env
VITE_API_URL="http://localhost:3001"
VITE_SOCKET_URL="http://localhost:3001"
```

## Database Notes

Local database name:

```text
hostel_platform
```

Default database credentials expected by the repo:

- username: `postgres`
- password: `postgres`
- host: `localhost`
- port: `5432`

If a teammate uses different PostgreSQL credentials, they must update:

```text
server/.env
```

## Run Order Summary

Always use this order on a fresh machine:

1. Install PostgreSQL
2. Create database `hostel_platform`
3. Install `server` dependencies
4. Install `client` dependencies
5. Run Prisma migration
6. Run Prisma seed
7. Start backend
8. Start frontend
9. Sign in with demo credentials

## Demo Credentials

These are created by the seed file:

- Admin: `admin@sau.ac.in` / `admin123`
- Warden: `warden@sau.ac.in` / `warden123`
- Student: `student@sau.ac.in` / `student123`

If seed did not complete successfully, these accounts will not exist.

## Backend URLs

When backend is running:

- API root: `http://localhost:3001/api/v1`
- Swagger docs: `http://localhost:3001/api/docs`

## Frontend URL

When frontend is running:

- `http://localhost:5173`

## For New Teammates

If you are joining the project and just want it running:

- use `QUICKSTART.md`

If something breaks:

- use `TROUBLESHOOTING.md`

If you want to improve the project:

- start by reading root [README.md](c:\Users\amarr\OneDrive\Desktop\smarthack\HM\hostel-platform\README.md)
- then inspect `client/src` and `server/src`
- then use Swagger docs after backend starts
