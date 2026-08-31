# Docker Deployment Guide

This guide explains how to deploy the MediaMTX Dashboard using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### 1. Clone the repository

\`\`\`bash
git clone <your-repo-url>
cd mediamtx-panel
\`\`\`

### 2. Start the services

\`\`\`bash
# Using docker-compose
docker-compose up -d

# Or using make
make up
\`\`\`

### 3. Access the services

- **Dashboard**: http://localhost:3000
- **MediaMTX API**: http://localhost:9997
- **MediaMTX Metrics**: http://localhost:9998
- **RTSP**: rtsp://localhost:8554
- **RTMP**: rtmp://localhost:1935
- **HLS**: http://localhost:8888
- **WebRTC**: http://localhost:8889

## Configuration

### Environment Variables

Create a `.env` file in the root directory to customize settings:

\`\`\`env
# Dashboard
DASHBOARD_PORT=3000
NEXT_PUBLIC_MEDIAMTX_API_URL=http://localhost:9997

# MediaMTX Ports
RTSP_PORT=8554
RTMP_PORT=1935
HLS_PORT=8888
WEBRTC_PORT=8889
API_PORT=9997
METRICS_PORT=9998

# MediaMTX Authentication (optional)
MEDIAMTX_USERNAME=admin
MEDIAMTX_PASSWORD=changeme
\`\`\`

### MediaMTX Configuration

Edit `mediamtx.yml` to customize MediaMTX settings. The configuration file is mounted as a volume.

Key settings you might want to change:

\`\`\`yaml
# Enable authentication
authMethod: internal
authInternalUsers:
  - user: admin
    pass: your_password_here
    permissions:
      - action: publish
      - action: read

# Recording settings
pathDefaults:
  record: yes
  recordPath: /recordings/%path/%Y-%m-%d_%H-%M-%S-%f
  recordDeleteAfter: 7d  # Keep recordings for 7 days
\`\`\`

## Available Commands

Using make (recommended):

\`\`\`bash
make help           # Show all available commands
make up             # Start services in background
make down           # Stop services
make restart        # Restart services
make logs           # Show logs from all services
make logs-dashboard # Show dashboard logs only
make logs-mediamtx  # Show MediaMTX logs only
make clean          # Remove all containers and volumes
make rebuild        # Rebuild images and restart
make dev            # Run in development mode (with logs)
\`\`\`

Using docker-compose directly:

\`\`\`bash
docker-compose up -d              # Start in background
docker-compose down               # Stop services
docker-compose logs -f            # Follow logs
docker-compose ps                 # Show running containers
docker-compose restart            # Restart all services
docker-compose exec dashboard sh  # Shell into dashboard
\`\`\`

## Architecture

\`\`\`
┌─────────────────────┐
│   Dashboard (3000)  │
│   Next.js App       │
└──────────┬──────────┘
           │
           │ HTTP/API
           ↓
┌─────────────────────┐
│  MediaMTX (9997)    │
│  Streaming Server   │
├─────────────────────┤
│  RTSP    :8554      │
│  RTMP    :1935      │
│  HLS     :8888      │
│  WebRTC  :8889      │
│  Metrics :9998      │
└─────────────────────┘
\`\`\`

## Volumes

The following volumes are created:

- `./recordings:/recordings` - Stores recorded streams
- `./mediamtx.yml:/mediamtx.yml` - MediaMTX configuration

## Networking

Both services run on a custom bridge network called `mediamtx-network`. This allows:

- The dashboard to communicate with MediaMTX using the service name `mediamtx`
- Isolation from other Docker networks
- Easy service discovery

## Production Deployment

### 1. Build for production

\`\`\`bash
docker-compose build --no-cache
\`\`\`

### 2. Set production environment variables

Create a `.env.production` file:

\`\`\`env
NODE_ENV=production
NEXT_PUBLIC_MEDIAMTX_API_URL=https://your-domain.com/api
\`\`\`

### 3. Use a reverse proxy (recommended)

Example Nginx configuration:

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    # Dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # MediaMTX API
    location /api/ {
        proxy_pass http://localhost:9997/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # HLS Streams
    location /hls/ {
        proxy_pass http://localhost:8888/;
    }
}
\`\`\`

### 4. Enable SSL/TLS

Use Let's Encrypt with certbot:

\`\`\`bash
sudo certbot --nginx -d your-domain.com
\`\`\`

## Troubleshooting

### Dashboard can't connect to MediaMTX

1. Check if MediaMTX is running:
   \`\`\`bash
   docker-compose ps
   \`\`\`

2. Check MediaMTX logs:
   \`\`\`bash
   make logs-mediamtx
   \`\`\`

3. Verify API is enabled in `mediamtx.yml`:
   \`\`\`yaml
   api: yes
   apiAddress: :9997
   \`\`\`

### Port conflicts

If ports are already in use, modify the port mappings in `docker-compose.yml`:

\`\`\`yaml
ports:
  - "3001:3000"  # Change 3001 to an available port
\`\`\`

### Permission issues with recordings

Ensure the recordings directory has correct permissions:

\`\`\`bash
mkdir -p recordings
chmod 777 recordings
\`\`\`

### Container won't start

Check Docker logs:
\`\`\`bash
docker-compose logs dashboard
docker-compose logs mediamtx
\`\`\`

Clear everything and rebuild:
\`\`\`bash
make clean
make rebuild
\`\`\`

## Updating

### Update MediaMTX

\`\`\`bash
docker-compose pull mediamtx
docker-compose up -d mediamtx
\`\`\`

### Update Dashboard

\`\`\`bash
git pull
docker-compose build dashboard
docker-compose up -d dashboard
\`\`\`

## Backup and Restore

### Backup recordings

\`\`\`bash
docker run --rm -v $(pwd)/recordings:/recordings -v $(pwd)/backup:/backup alpine tar czf /backup/recordings-$(date +%Y%m%d).tar.gz /recordings
\`\`\`

### Restore recordings

\`\`\`bash
docker run --rm -v $(pwd)/recordings:/recordings -v $(pwd)/backup:/backup alpine tar xzf /backup/recordings-20240101.tar.gz -C /
\`\`\`

## Security Considerations

1. **Change default passwords** in `mediamtx.yml`
2. **Use HTTPS** in production with a reverse proxy
3. **Restrict API access** by IP if possible
4. **Enable authentication** for streaming protocols
5. **Keep Docker images updated** regularly

## Support

For issues related to:
- **Dashboard**: Open an issue in this repository
- **MediaMTX**: Visit https://github.com/bluenviron/mediamtx
\`\`\`

\`\`\`typescriptreact file="README.md"
[v0-no-op-code-block-prefix]# Mediamtx config

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/alinux110s-projects/v0-mediamtx-config)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/SQc3F5fQAcd)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/alinux110s-projects/v0-mediamtx-config](https://vercel.com/alinux110s-projects/v0-mediamtx-config)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/SQc3F5fQAcd](https://v0.dev/chat/projects/SQc3F5fQAcd)**

## Docker Deployment

This project can be easily deployed using Docker. See [DOCKER.md](DOCKER.md) for detailed instructions.

### Quick Start with Docker

\`\`\`bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
\`\`\`

Access the dashboard at http://localhost:3000 and MediaMTX at http://localhost:9997.

For advanced configuration and production deployment, see the [Docker Deployment Guide](DOCKER.md).

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
