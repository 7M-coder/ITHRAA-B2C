# Ithraa B2C

One Git repository containing a React frontend, a Laravel API, and optional MySQL/Docker development services. Docker is optional. No authentication or product features are included.

## Requirements and structure

- Local development: PHP 8.4 with `pdo_mysql`, Composer 2, Node.js 22.13 LTS or 24+, npm, and MySQL 8.4 LTS.
- Container development: Docker Engine with Docker Compose. Host PHP and Node are not required for full-container development.
- `frontend/`: React 18, TypeScript, Vite 6, Ant Design 5, Axios, React Query, Tailwind 4, i18next, and Vitest.
- `backend/`: Laravel 13, migrations, API routes, PHPUnit tests, and Pint.
- `docker/` and `compose.yaml`: development images and service orchestration.
- Root npm dependencies provide Git hooks and commit validation. Application dependencies stay separate.

## Fully local setup

Run these commands from the repository root:

```sh
npm ci
npm --prefix frontend ci
composer --working-dir=backend install
cp frontend/.env.sample frontend/.env
cp backend/.env.example backend/.env
php backend/artisan key:generate
```

Create a dedicated database and user in your local MySQL instance. Replace the sample password before executing this SQL:

```sql
CREATE DATABASE ithraa_b2c CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ithraa'@'localhost' IDENTIFIED BY 'replace-with-a-local-password';
GRANT ALL PRIVILEGES ON ithraa_b2c.* TO 'ithraa'@'localhost';
```

Set the matching `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in `backend/.env`. Use `DB_HOST=127.0.0.1` and `DB_PORT=3306` for a standard local server. Then:

```sh
php backend/artisan migrate
npm run dev:backend
```

In another terminal:

```sh
npm run dev:frontend
```

Frontend: http://localhost:3000. Backend: http://localhost:8000. Check integration at http://localhost:3000/api/health. If port 3000 is occupied, use `npm run dev:frontend -- --port 3017`. The backend command accepts Artisan options; for an alternate port, invoke `php backend/artisan serve --port=8001` and change the frontend proxy target accordingly.

The root redirects to the saved language or Arabic. `/ar` is RTL and `/en` is LTR. The `i18nextLng` storage key persists language; `theme` persists light/dark mode. Ant Design follows both. Tajawal fonts and their OFL license are bundled.

## API configuration

| Setting | Default | Purpose |
| --- | --- | --- |
| `frontend/.env`: `VITE_BACKEND_API_URL` | `/api/` | Complete browser-facing API base URL |
| `frontend/.env`: `VITE_PROXY_TARGET` | `http://127.0.0.1:8000` | Development proxy target |
| `backend/.env`: `DB_*` | MySQL on localhost | Local Laravel database connection |
| Root `.env`: port variables | 3000 / 8000 / 3307 | Docker host port overrides |

Axios keeps JSON headers and a 60-second timeout. It does not add authentication, refresh tokens, or locale prefixes. Opening the welcome page does not call the API. Vite forwards `/api/*` to Laravel. Production hosting must provide its own API routing or an explicit backend URL; Vite's proxy is development-only.

`GET /api/health` runs a read-only database query. It returns `{"status":"ok","database":"connected"}` with HTTP 200, or `{"status":"unavailable","database":"unavailable"}` with HTTP 503. No credentials or exception details are returned. Laravel's `/up` endpoint checks application liveness separately.

## Docker: initial preparation

```sh
cp .env.example .env
cp backend/.env.example backend/.env
```

Set nonempty, unique `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` values in the root `.env`. Never commit this file. Compose refuses to start without these values. Root `.env` controls Docker; `backend/.env` controls Laravel application settings. Compose overrides Laravel's database connection for the container network.

### Database-only Docker

```sh
docker compose up -d mysql
```

Use local PHP and Node as described above, but configure `backend/.env` with `DB_HOST=127.0.0.1`, `DB_PORT=3307`, and the database/user/password from the root `.env`. Run migrations explicitly and start the local applications.

### Full Docker

Install container dependencies and generate the key once before starting the applications:

```sh
docker compose build
docker compose run --rm --no-deps frontend npm ci
docker compose run --rm --no-deps backend composer install --no-interaction
docker compose run --rm --no-deps backend php artisan key:generate
docker compose up -d mysql
docker compose run --rm backend php artisan migrate
docker compose up -d
```

Source mounts enable live updates. Separate named volumes hold Linux Node dependencies, PHP dependencies, and MySQL data. Backend startup waits for the MySQL readiness check. Keys and migrations are never regenerated automatically on restart.

After a dependency lockfile changes, rerun the corresponding container dependency-install command. Do not share host `node_modules` with the frontend container.

### Ports and tools

Change `FRONTEND_PORT`, `BACKEND_PORT`, or `MYSQL_PORT` in the root `.env` when a host port is occupied. Internal service ports remain unchanged. Database tools on the host connect to `127.0.0.1:3307` by default. Containers use `mysql:3306`. Laravel's database user is separate from root. Services bind host ports to localhost.

### Shutdown and data

```sh
docker compose down
```

Normal shutdown and image rebuilding preserve MySQL data. Changing MySQL initialization credentials after a database volume already exists does not update existing users; update them deliberately with SQL.

**Destructive development reset:** `docker compose down -v` deletes this project's MySQL data and dependency volumes. Use it only when you intend to discard those contents; afterward, repeat initial setup. Never use it as a normal shutdown command.

These containers use development servers. Production hosting, TLS, process management, and deployment are a separate phase.

## Checks

```sh
npm run build
npm test
npm run lint
npm run format:check
```

Individual commands: `npm run test:frontend`, `npm run test:backend`, `npm run lint:frontend`, `npm run lint:backend`. Format frontend files with `npm --prefix frontend run format`; format PHP with `composer --working-dir=backend format`.

PHPUnit defaults to an isolated in-memory database for fast tests. The healthy response uses a real test-database query; the failure test simulates a connection exception. To verify MySQL migrations, configure `backend/.env.testing` with a separate `ithraa_b2c_test` database and use `php backend/artisan migrate --env=testing`; never point migration-reset tests at development data.

Git hooks run lint-staged on frontend source and PHP files; commit messages use conventional commits. There is one root Git repository and no configured remote. Run `npm ci` at the root to install hooks.

## Troubleshooting

- Database unavailable: confirm the server is running, credentials match, and the correct local/container host and port are configured. Run `php backend/artisan config:clear` after changing cached configuration.
- Containers unavailable: start Docker or your existing Docker runtime, then retry `docker compose config` and `docker compose up -d`.
- Missing dependencies: run the appropriate local or container install command. Full Docker needs its own dependency installation.
- Port occupied: override the host port rather than stopping another project's services.
- Blank frontend: check the Vite terminal, API proxy target, and browser console.

## Dependency baseline

Frontend major versions are retained. The initial frontend audit reported eight advisories, including two critical advisories in the development test-tooling chain. Major-version remediation is outside this restructuring. Review `npm --prefix frontend audit` before exposing development servers.

jsdom 25 cannot parse Ant Design CSS layers. Tests filter that specific parser message; real-browser checks cover rendering and theme persistence.

## Verification for this setup

- Clean root/frontend npm installs and Composer installation passed.
- All 11 tests passed: seven frontend tests and four Laravel tests.
- Frontend production build, TypeScript checks, ESLint, Pint, and formatting checks passed.
- Laravel migrations and real HTTP requests through the frontend proxy passed against an isolated instance of the machine's installed MySQL 9.0.1. That temporary instance was stopped after verification; existing databases were not changed.
- Docker Compose configuration validated. Docker images and MySQL 8.4 container execution/persistence remain unverified because the Docker engine was stopped.
- Configure your local MySQL credentials before running the backend locally, or follow the Docker setup when the engine is running. A local application key has already been generated; keep it private.
