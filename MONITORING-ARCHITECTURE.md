# MediaMTX Dashboard Monitoring Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         MONITORING STACK                                  │
└──────────────────────────────────────────────────────────────────────────┘

                      ┌─────────────────────────┐
                      │   User / Administrator   │
                      └────────────┬────────────┘
                                   │
                                   │ HTTP
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           NGINX Reverse Proxy                             │
│                              (Port 80)                                    │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  /grafana/   │  │ /monitoring/ │  │  /metrics/   │                   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                   │
└─────────┼──────────────────┼──────────────────┼──────────────────────────┘
          │                  │                  │
          │                  │                  │
          ▼                  ▼                  ▼
    ┌─────────┐      ┌─────────────┐    ┌──────────────┐
    │ Grafana │      │ Prometheus  │    │ Node Exporter│
    │  :3001  │◄─────│   :9090     │◄───│    :9100     │
    └─────────┘      └──────┬──────┘    └──────────────┘
         │                  │
         │ Queries          │ Scrapes (10s)
         │                  │
         │                  ├───────────────────────────┐
         │                  │                           │
         │                  ▼                           ▼
         │          ┌──────────────┐          ┌──────────────┐
         │          │  MediaMTX    │          │  Prometheus  │
         │          │  Publisher   │          │  Self-Metrics│
         │          │  :9998       │          │  :9090       │
         │          │  /metrics    │          └──────────────┘
         │          └──────────────┘
         │
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                    GRAFANA DASHBOARDS                         │
│                                                               │
│  ┌────────────────────────┐  ┌─────────────────────────┐    │
│  │  MediaMTX Dashboard    │  │  System Metrics         │    │
│  │  ─────────────────     │  │  ──────────────         │    │
│  │  • Active Paths        │  │  • CPU Usage            │    │
│  │  • HLS Muxers          │  │  • Memory Usage         │    │
│  │  • RTSP Connections    │  │  • Disk Usage           │    │
│  │  • WebRTC Sessions     │  │  • Network Traffic      │    │
│  │  • Bandwidth Metrics   │  │  • Disk I/O             │    │
│  │  • Readers per Path    │  │  • System Uptime        │    │
│  └────────────────────────┘  └─────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘


DATA FLOW
─────────

1. MediaMTX Publisher exposes metrics at :9998/metrics
2. Node Exporter exposes system metrics at :9100/metrics
3. Prometheus scrapes both endpoints every 10 seconds
4. Prometheus stores time-series data
5. Grafana queries Prometheus for dashboard data
6. Users access via Nginx proxy or direct ports


METRICS COLLECTED
─────────────────

MediaMTX Metrics (from publisher:9998):
  • mediamtx_paths                    - Number of active streaming paths
  • mediamtx_hls_muxers               - Number of HLS muxers
  • mediamtx_rtsp_conns               - RTSP connections count
  • mediamtx_rtmp_conns               - RTMP connections count
  • mediamtx_webrtc_sessions          - WebRTC sessions count
  • mediamtx_paths_bytes_received     - Bytes received per path
  • mediamtx_paths_bytes_sent         - Bytes sent per path
  • mediamtx_paths_readers            - Number of readers per path

System Metrics (from node-exporter:9100):
  • node_cpu_seconds_total            - CPU usage by core and mode
  • node_memory_*                     - Memory usage statistics
  • node_filesystem_*                 - Disk usage and availability
  • node_network_*                    - Network traffic statistics
  • node_disk_*                       - Disk I/O operations
  • node_boot_time_seconds            - System boot time


PORTS MAPPING
─────────────

External → Internal
  80       → nginx:80           (HTTP reverse proxy)
  554      → publisher:8554     (RTSP)
  3000     → dashboard:3000     (Dashboard UI)
  3001     → grafana:3000       (Grafana UI - Direct Access)
  9090     → prometheus:9090    (Prometheus UI)
  9100     → node-exporter:9100 (Node Exporter metrics)
  9997     → publisher:9997     (MediaMTX API)
  9998     → publisher:9998     (MediaMTX metrics)
  9999     → publisher:9999     (MediaMTX pprof)
  8888     → publisher:8888     (HLS)
  8889     → publisher:8889     (WebRTC)


DOCKER NETWORK
──────────────

All services run on the same Docker network: mediamtx_network
Services can communicate using their container names:
  - prometheus_mediamtx
  - grafana_mediamtx
  - node-exporter_mediamtx
  - publisher
  - dashboard
  - nginx_mediamtx


VOLUMES
───────

  prometheus_data → /prometheus        (Prometheus time-series database)
  grafana_data    → /var/lib/grafana   (Grafana dashboards and settings)


CONFIGURATION FILES
───────────────────

  prometheus.yml                               - Prometheus scrape configuration
  mediamtx.yml                                 - MediaMTX server config (metrics enabled)
  docker-compose.yml                           - Container orchestration
  grafana/provisioning/datasources.yml         - Grafana datasource config
  grafana/provisioning/dashboards.yml          - Dashboard provisioning config
  grafana/provisioning/dashboards/*.json       - Dashboard definitions
  nginx/nginx.conf                             - Nginx reverse proxy config


MONITORING WORKFLOW
───────────────────

    Start Services
         │
         ▼
    MediaMTX starts → Exposes metrics on :9998
         │
         ▼
    Node Exporter starts → Exposes system metrics on :9100
         │
         ▼
    Prometheus starts → Scrapes metrics every 10s
         │
         ▼
    Grafana starts → Auto-provisions datasource and dashboards
         │
         ▼
    Access Grafana → View real-time metrics and dashboards
         │
         ▼
    Monitor streams, bandwidth, and system health


SECURITY NOTES
──────────────

  ✓ Default Grafana password should be changed in production
  ✓ Consider adding authentication to Nginx for metrics endpoints
  ✓ Use HTTPS/TLS in production environments
  ✓ Limit network exposure of monitoring ports in production
  ✓ MediaMTX API requires authentication (configured in mediamtx.yml)


For detailed instructions, see MONITORING.md
For quick start guide, see MONITORING-QUICKSTART.md
```
