# Echo — Full‑stack Example App 🧩

A simple, full‑stack project demonstrating an authenticated web app with a React frontend and a lightweight TypeScript backend. It showcases user authentication (JWT + refresh tokens), a user profile, and CRUD operations for a sample "post" entity. The repository includes both the frontend and the backend, tests, and developer-friendly configuration.

---

## Summary 💡

Echo is a small web application that lets a user sign up, log in, and manage simple posts (create, read, update, delete). The app demonstrates a typical web product flow: a user-facing interface (frontend) talking to a server (backend) that stores data in a database. It's suitable as a learning project or a starting point for production-ready work.

---

## Quick technical overview 🔧

- Frontend: React + TypeScript, built to run with Bun (fast JavaScript runtime). Uses Tailwind for styling.
- Backend: Express-style API in TypeScript, runs on Bun. Implements JWT authentication, refresh tokens, and uses MySQL (via mysql2) for persistence.
- Testing: Vitest + Supertest for backend tests, Vitest + React Testing Library for frontend tests.

---

## Features ✅

- User registration and login (password hashing + JWT)
- Refresh token flow and logout
- Protected routes (server-side middleware)
- User profile (view/update/delete)
- CRUD operations for Posts (create, list, update, delete)
- Tests for API and frontend components

---

## Getting started — Developer quickstart 🧭

Prerequisites:
- Bun (https://bun.sh) installed on your machine
- MySQL (local or remote) OR Docker to run a local MySQL instance
Clone the repo:

```bash
git clone <repo-url>
cd <repo-folder>
```

Backend (API):

```bash
cd backend
bun install
# copy environment variables
copy .env.example .env   # (Windows PowerShell)
# or `cp .env.example .env` on macOS/Linux
# Edit .env to set DB credentials and SECRET_KEY
bun run dev
```

Frontend (UI):

```bash
cd frontend
bun install
bun run dev
# open http://localhost:3000 (see console output for actual port)
```

Running tests:

```bash
# Backend tests
cd backend
bun run test

# Frontend tests
cd frontend
bun run test
```

Database: if you need a local MySQL for development, you can run:

```bash
docker run --name mysql-local -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=echo -p 3306:3306 -d mysql:8.0
```

Then set `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root`, and `DB_PASSWORD=root` in `.env`.

---

## API (high level)

Key endpoints (see `backend/server.ts` for details):

- POST /signup — create a new user
- POST /login — login, returns access token and sets refresh cookie
- POST /refresh — exchange refresh token for new access token
- POST /logout — clear refresh token
- GET/PUT/DELETE /profile — user profile actions (protected)
- GET/PUT/DELETE /post — list and manage posts (some routes protected)

---

## Project structure 📁

- `/backend` — server, controllers, models, tests
- `/frontend` — React app, components, tests
- Root contains this README and project-level configurations

---

## For maintainers / contributors 🤝

- Follow existing TypeScript + ESLint + Prettier configs
- Add tests when you change behavior
- Use feature branches and open PRs with a clear description

---

## Troubleshooting & notes ⚠️

- If the server fails to initialize because the DB is unreachable, tweak `DB_INIT_RETRIES` or run with a local MySQL instance.
- Never commit real secrets; keep `.env` in `.gitignore`.

---

## Contact / License

If you have questions or want to contribute, open an issue or a PR. This project is provided as-is for learning and demonstration purposes.

---

(If you'd like, I can also update `backend/README.md` and `frontend/README.md` with short links back to this root README.)

