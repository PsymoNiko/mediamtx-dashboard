
 

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 360" width="1200" height="360" role="img" aria-label="MediaMTX Dashboard animated logo">
  <defs>
    <!-- Gradient matching the logo: blue -> cyan -->
    <linearGradient id="blueCyan" x1="0%" x2="100%" y1="0%" y2="0%">
      <stop id="s1" offset="0%" stop-color="#1666C6"/>
      <stop id="s2" offset="100%" stop-color="#13A8C8"/>
      <!-- animate gradient travel -->
      <animate xlink:href="#s1" attributeName="offset" values="0%;10%;0%" dur="3.5s" repeatCount="indefinite" />
      <animate xlink:href="#s2" attributeName="offset" values="100%;90%;100%" dur="3.5s" repeatCount="indefinite" />
    </linearGradient>

    <!-- Slight drop shadow filter for depth -->
    <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/>
    </filter>

    <!-- Reusable wifi arcs shape -->
    <g id="wifiShape">
      <path d="M0 0 C10 0 16 8 16 18" stroke-width="6" fill="none" stroke-linecap="round"/>
    </g>
  </defs>

  <!-- Background (transparent) but black-friendly if displayed on dark background -->
  <rect width="100%" height="100%" fill="transparent"/>

  <!-- Main text group -->
  <g transform="translate(60,0)">
    <!-- MEDIAMTX -->
    <text x="540" y="140" text-anchor="middle"
          font-family="Montserrat, Arial, Helvetica, sans-serif"
          font-weight="800" font-size="140" letter-spacing="2"
          filter="url(#softShadow)"
          fill="url(#blueCyan)">
      MEDIAMTX
    </text>

    <!-- DASHBOARD (smaller, subtle pulse) -->
    <g transform="translate(0,0)">
      <text id="subtitle" x="540" y="260" text-anchor="middle"
            font-family="Montserrat, Arial, Helvetica, sans-serif"
            font-weight="700" font-size="90" letter-spacing="3"
            fill="url(#blueCyan)">
        DASHBOARD
      </text>

      <!-- subtitle pulse -->
      <animateTransform xlink:href="#subtitle"
                        attributeName="transform"
                        type="scale"
                        values="1;1.03;1"
                        dur="3.6s"
                        repeatCount="indefinite"
                        additive="replace"
                        />
      <!-- subtle fade in/out to make it lively -->
      <animate xlink:href="#subtitle"
               attributeName="opacity"
               values="0.95;1;0.95"
               dur="3.6s"
               repeatCount="indefinite" />
    </g>
  </g>

  <!-- Wi-Fi icon at top-right of the word mark (animated 'wave' opacity) -->
  <g transform="translate(983,38) scale(1.3)">
    <!-- three arcs with staggered animation -->
    <path d="M10 86 C30 50 70 50 90 86" stroke="url(#blueCyan)" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.95">
      <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="2.4s" repeatCount="indefinite"/>
    </path>
    <path d="M20 60 C40 36 60 36 80 60" stroke="url(#blueCyan)" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.9">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="2.6s" begin="0.2s" repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="2.6s" begin="0.2s" repeatCount="indefinite"/>
    </path>
    <path d="M32 36 C50 18 70 18 88 36" stroke="url(#blueCyan)" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.85">
      <animate attributeName="opacity" values="0.45;1;0.45" dur="2.8s" begin="0.4s" repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="2.8s" begin="0.4s" repeatCount="indefinite"/>
    </path>
  </g>

  <!-- Optional tiny entrance animation for whole logo (a light rise + fade-in) -->
  <g id="whole" opacity="0">
    <animate attributeName="opacity" from="0" to="1" dur="0.9s" begin="0s" fill="freeze"/>
  </g>
</svg>



<h1 align="center">
  <a href="https://mediamtx.org">
    <img src="logo.png" alt="MediaMTX">
  </a>

  <br>
  <br>

 [![Website](https://img.shields.io/badge/website-mediamtx.org-1c94b5)](https://mediamtx.org)
  [![Test](https://github.com/bluenviron/mediamtx/actions/workflows/code_test.yml/badge.svg)](https://github.com/bluenviron/mediamtx/actions/workflows/code_test.yml)
  [![Lint](https://github.com/bluenviron/mediamtx/actions/workflows/code_lint.yml/badge.svg)](https://github.com/bluenviron/mediamtx/actions/workflows/code_lint.yml)
  [![CodeCov](https://codecov.io/gh/bluenviron/mediamtx/branch/main/graph/badge.svg)](https://app.codecov.io/gh/bluenviron/mediamtx/tree/main)
  [![Release](https://img.shields.io/github/v/release/bluenviron/mediamtx)](https://github.com/bluenviron/mediamtx/releases)
  [![Docker Hub](https://img.shields.io/badge/docker-bluenviron/mediamtx-blue)](https://hub.docker.com/r/bluenviron/mediamtx)
</h1>

# mediamtx-dashboard

* [bluenviron / mediamtx](https://github.com/bluenviron/mediamtx):Ready-to-use SRT / WebRTC / RTSP / RTMP / LL-HLS media server and media proxy that allows to read, publish, proxy, record and playback video and audio streams.

A modern dashboard project leveraging the latest web technologies to provide a robust and flexible interface for managing media streaming with MediaMTX.

## Technologies Used

- **TypeScript** (79%): Strongly-typed JavaScript for scalable application development.
- **Shell** (10.1%): Used for scripting automation and deployment.
- **CSS** (7.3%): For custom styling and layouts.
- **Makefile** (2.3%): For build and automation tasks.
- **Other** (1.3%): Additional supporting scripts and configuration.

The project structure and files indicate usage of:
- **Next.js** (evident from `next.config.mjs`), a React-based framework for SSR and SSG.
- **pnpm** (see `PNPM.md`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`) as the package manager.
- **Docker** (multiple Dockerfiles and Compose files) for containerized development and deployment.
- **PostCSS** (via `postcss.config.mjs`) for advanced CSS processing.

## Concept

The dashboard is designed to simplify the management and monitoring of MediaMTX-based streaming infrastructure. It provides an intuitive interface, real-time updates, and modular components for extensibility. The architecture supports both local development and production deployments using Docker and pnpm workspaces.

## Getting Started

### Prerequisites

- **Node.js** (recommended LTS version)
- **pnpm**: Install via `npm install -g pnpm`
- **Docker** (for containerized workflows)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PsymoNiko/mediamtx-dashboard.git
   cd mediamtx-dashboard
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running the Project

#### Local Development

```bash
pnpm dev
```

Or, using Docker Compose for a local containerized environment:
* PS: If you want to run the dashboard on `pnpm` as in local, replace this config in `.env.local`


```bash
NEXT_PUBLIC_MEDIAMTX_API_URL=http://localhost:9997
NEXT_PUBLIC_MEDIAMTX_HLS_URL=http://localhost:8888
MTX_WEBRTCADDITIONALHOSTS="localhost"
```

```bash

docker-compose up publisher -d

pnpm run build
pnpm run dev
```

#### Production

Build and run with Docker Compose:

```bash
docker-compose -f docker-compose.prod.yml up --build
```

Or, use the provided Dockerfiles for different environments (`Dockerfile`, `Dockerfile.dev`, `Dockerfile.simple`, `Dockerfile.debian`).

#### Using Makefile

For advanced build or automation tasks, refer to the `Makefile`:

```bash
make <target>
```

### Additional Documentation

- See `PNPM.md` for pnpm workspace and monorepo management.
- See `DOCKER.md` for detailed Docker usage instructions.

## Project Structure

- `app/`, `components/`, `lib/`, `public/`, `styles/` — Main application, UI, and assets.
- Multiple Dockerfiles and Compose files for flexible deployment.
- `Makefile` for task automation and builds.

## License

No license information is currently provided. Please check with the repository owner for usage guidelines.

---

For more details, visit the [GitHub repository](https://github.com/PsymoNiko/mediamtx-dashboard).
