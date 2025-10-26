


<h1 align="center">
  <a href="https://mediamtx.org">
    <img src="Dashboard_Logo.jpg" alt="MediaMTX">
  </a>

  <br>
  <br>


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
