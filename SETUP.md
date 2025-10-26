Mediamtx Dashboard Setup (Docker Compose)

Date: 2025-10-26

Overview
- NEXT_PUBLIC_* variables are compiled into the client at build time. To change them, you must rebuild the image.
- docker-compose is configured to build the dashboard image and pass build args from your .env file.

Prerequisites
- Docker and Docker Compose v2 installed

Files
- .env (runtime + build values)
  - NEXT_PUBLIC_MEDIAMTX_API_URL=http://<host>:<port>/v3/config
  - NEXT_PUBLIC_MEDIAMTX_HLS_URL=http://<host>:<port>/hls
  - Other runtime vars as needed
- .env.local is ignored by builds (see .dockerignore) to prevent accidental overrides.

Build and Run
- Start stack and force rebuild when NEXT_PUBLIC_* changes:
  docker compose --env-file .env up -d --build

Update Config
- Edit .env with new values for NEXT_PUBLIC_MEDIAMTX_API_URL / NEXT_PUBLIC_MEDIAMTX_HLS_URL
- Rebuild and restart:
  docker compose --env-file .env up -d --build

Notes
- At runtime, env_file (./.env) still provides environment to the container, but client-side values come from build-time.
- If you prefer plain docker build:
  docker build \
    --build-arg NEXT_PUBLIC_MEDIAMTX_API_URL=$(grep ^NEXT_PUBLIC_MEDIAMTX_API_URL .env | cut -d= -f2-) \
    --build-arg NEXT_PUBLIC_MEDIAMTX_HLS_URL=$(grep ^NEXT_PUBLIC_MEDIAMTX_HLS_URL .env | cut -d= -f2-) \
    -t mediamtx-dashboard:latest .
  docker run --env-file .env -p 3000:3000 mediamtx-dashboard:latest

Troubleshooting
- Verify which values were compiled:
  docker compose exec dashboard printenv | grep NEXT_PUBLIC_
  (Client still uses build-time values; change .env and rebuild if different.)
- Clear and rebuild from scratch if cache interferes:
  docker compose down --volumes --remove-orphans
  docker builder prune -f
  docker compose --env-file .env up -d --build

GitHub Pages (pnpm + Next.js)
- We added .github/workflows/pages.yml to build with pnpm and deploy a static export using GitHub Pages.
- Enable Pages: Repo Settings -> Pages -> Build and deployment -> Source: GitHub Actions.
- On push to main, the workflow runs: pnpm install, next build, next export to out, then deploys.
- For org/repo pages (not username.github.io), the site is served under /<repo>; basePath is set automatically by the workflow.
- If you need build-time envs (e.g., NEXT_PUBLIC_MEDIAMTX_API_URL), set repo variables/secrets and export them in the workflow, e.g.:
  - name: Inject envs
    run: |
      echo "NEXT_PUBLIC_MEDIAMTX_API_URL=${{ vars.NEXT_PUBLIC_MEDIAMTX_API_URL }}" >> "$GITHUB_ENV"
      echo "NEXT_PUBLIC_MEDIAMTX_HLS_URL=${{ vars.NEXT_PUBLIC_MEDIAMTX_HLS_URL }}" >> "$GITHUB_ENV"
