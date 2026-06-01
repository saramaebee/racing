# 🏁 racing

A small championship score tracker for [racing.saratonin.dev](https://racing.saratonin.dev).
Enter results once per run and see standings under **three criteria at once** — total time,
best single run, and placement points.

Built to be reusable across scorekeeping types: a timed event (luge), or a no-stopwatch
event scored purely by finishing place.

## Stack

- **Bun** runtime, TypeScript, no build step
- **Hono** — server-rendered JSX (forms POST back; no client framework)
- **bun:sqlite** — schema created on startup, data in `./data/racing.db`
- **biome** for lint/format

## How scoring works

You record a **time and/or a finishing place** per racer per run. Three leaderboards are
derived from that single set of results:

| Board | How | Winner |
|-------|-----|--------|
| **Total time** | Sum of every run's time | Lowest (needs all runs timed) |
| **Best run** | Fastest single run | Lowest |
| **Points** | Per run, finishing order → points table (default `6,5,4,3,2,1`), summed | Highest |

For timed events, finishing order (and therefore points) is derived from the times. For a
no-stopwatch event, switch the score grid to **Places** and enter `1,2,3…` directly.

Ties share a rank and the better points slot (standard competition ranking).

## Run locally

```sh
bun install
cp .env.example .env          # set EDIT_PASSWORD and SESSION_SECRET
bun run dev                   # http://localhost:3000
```

Viewing is public. Click **Log in to edit** and enter `EDIT_PASSWORD` to create
championships and enter scores.

```sh
bun test           # scoring + time-parsing tests
bun run typecheck
bun run lint
```

## Deploy to racing.saratonin.dev

**Live at https://racing.saratonin.dev.** Runs as a systemd unit (`racing`) on the
`dashboard-vm` GCE instance (project `screeps-dash`, the same box as atmosfera), on port
**3001** behind Caddy. DNS A record lives in the `saratonin-dev` zone (project
`saratonin-staging`). Push to `main` auto-deploys via the workflow below.

The steps below document the original setup (already done):

1. **DNS** — add an A record `racing.saratonin.dev` → the VM's public IP.
2. **Install on the VM:**
   ```sh
   curl -fsSL https://raw.githubusercontent.com/saramaebee/racing/main/deploy/install.sh | bash
   ```
   This installs Bun, clones the repo to `~/racing`, writes a starter `.env`, and registers
   + starts the `racing` systemd service. **Edit `~/racing/.env`** to set a real `EDIT_PASSWORD`.
3. **Caddy** — add a site block and reload:
   ```
   racing.saratonin.dev {
     reverse_proxy localhost:3001
   }
   ```
   ```sh
   sudo systemctl reload caddy
   ```
4. **CI/CD** — `.github/workflows/deploy.yml` tests on push to `main`, then SSH-deploys and
   restarts the service. Set repo secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PORT`,
   `DEPLOY_SSH_KEY`.

### Day-2 ops

```sh
journalctl -u racing -f          # logs
sudo systemctl restart racing    # restart
```

The SQLite DB lives at `~/racing/data/racing.db` (gitignored) and survives restarts and
redeploys.
