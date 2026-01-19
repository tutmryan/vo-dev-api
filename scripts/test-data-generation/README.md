# Populate Presentations Script

Purpose

- Create 20k–30k `presentation` rows in the local development SQL Server database using the project's TypeORM entities.

Files

- `populate-presentations.ts` — script to generate and insert rows in batches of 1000.

Prerequisites

- Ensure local SQL Server is running (via Tilt/Docker Compose).
- Add `sqlserver` to your hosts file so it resolves to localhost when running scripts directly on your host machine:
  - **Windows**: Add `127.0.0.1 sqlserver` to `C:\Windows\System32\drivers\etc\hosts` (requires admin/elevated privileges)
  - **Linux/Mac**: Add `127.0.0.1 sqlserver` to `/etc/hosts` (requires sudo)
- Install dependencies in the `verified-orchestration-api` package:

```bash
cd verified-orchestration-api
npm install
# or if using pnpm: pnpm install
```

Run the script

- Using ts-node (recommended for quick runs):

```bash
cd verified-orchestration-api
npx ts-node scripts/populate-presentations.ts --count 20000 --daySpread 30
```

The script automatically loads environment variables from `.env`.

- Or for a smaller test run:

```bash
npx ts-node scripts/populate-presentations.ts --count 500
```

Notes

- The script creates a small set of `User`, `Identity`, and `Wallet` rows if none exist.
- It inserts presentations in batches of 1000 and logs progress.
- This is intended only for local development databases.
