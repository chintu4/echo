# express

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run server.ts
```

## Environment

This project reads configuration from environment variables. Copy `.env.example` to `.env` and set secrets before running locally.

```bash
cp .env.example .env
# edit .env and set SECRET_KEY and DB credentials
```

### Running a local MySQL for development

If you don't have access to the remote DB (or need fast local iterations), you can run a temporary MySQL instance using Docker:

```bash
docker run --name mysql-local -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=defaultdb -p 3306:3306 -d mysql:8.0
```

Then set `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root`, and `DB_PASSWORD=root` in your `.env`.

You can also tune `DB_CONNECT_TIMEOUT_MS` in `.env` (default 5000ms) to fail faster when a host is unreachable. For quick local development where the remote DB is unreachable, set `DB_INIT_RETRIES=0` to skip database initialization and start the server immediately (the server will run in degraded mode without a DB pool).


**Security note:** Never commit your `.env` file. Add `.env` to `.gitignore` and, if any real credentials were pushed, rotate them immediately.

This project was created using `bun init` in bun v1.2.22. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
