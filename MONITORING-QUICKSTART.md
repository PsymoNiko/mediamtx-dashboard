# Quick Start: Monitoring

This is a quick reference guide for getting started with monitoring. For detailed information, see [MONITORING.md](MONITORING.md).

## Start Monitoring Stack

```bash
# Start all services including monitoring
docker compose up -d

# Or start just monitoring services
docker compose up -d prometheus_mediamtx grafana_mediamtx node-exporter_mediamtx
```

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3001 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| Node Exporter | http://localhost:9100/metrics | - |
| MediaMTX Metrics | http://localhost:9998/metrics | - |

## Via Nginx Reverse Proxy

Once nginx is running:

| Service | URL |
|---------|-----|
| Grafana | http://localhost/grafana/ |
| Prometheus | http://localhost/monitoring/ |
| Node Exporter | http://localhost/metrics/ |

## Pre-configured Dashboards

Two dashboards are automatically provisioned:

1. **MediaMTX Dashboard** - Streaming metrics
   - Active paths, connections
   - Bandwidth usage
   - HLS muxers, WebRTC sessions
   
2. **System Metrics** - Infrastructure metrics
   - CPU, Memory, Disk usage
   - Network traffic
   - Disk I/O

## Quick Checks

### Verify all monitoring services are running

```bash
docker compose ps prometheus_mediamtx grafana_mediamtx node-exporter_mediamtx
```

### Check Prometheus targets

```bash
curl http://localhost:9090/api/v1/targets | jq
```

### Test MediaMTX metrics

```bash
curl http://localhost:9998/metrics
```

### View Grafana logs

```bash
docker compose logs -f grafana_mediamtx
```

## Common Tasks

### Change Grafana Password

Edit `docker-compose.yml`:
```yaml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=your_new_password
```

Then restart:
```bash
docker compose restart grafana_mediamtx
```

### Adjust Scrape Interval

Edit `prometheus.yml`:
```yaml
global:
  scrape_interval: 10s  # Change as needed
```

Then restart:
```bash
docker compose restart prometheus_mediamtx
```

### View Metrics in Prometheus

1. Open http://localhost:9090
2. Click "Graph"
3. Enter a metric name (e.g., `mediamtx_paths`)
4. Click "Execute"

## Troubleshooting

### No metrics showing in Grafana?

1. Check Prometheus targets: http://localhost:9090/targets (all should be "UP")
2. Verify MediaMTX metrics are enabled in `mediamtx.yml` (metrics: yes)
3. Check Grafana datasource: Configuration → Data Sources → Test

### Can't access Grafana?

```bash
# Check if container is running
docker compose ps grafana_mediamtx

# Check logs for errors
docker compose logs grafana_mediamtx

# Restart if needed
docker compose restart grafana_mediamtx
```

### Prometheus shows targets as "DOWN"?

```bash
# Check if services are running
docker compose ps

# Check network connectivity
docker compose exec prometheus_mediamtx ping -c 3 publisher

# Restart all monitoring services
docker compose restart prometheus_mediamtx node-exporter_mediamtx
```

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and set your values:
```env
NEXT_PUBLIC_MEDIAMTX_API_URL=http://localhost/v3/config
NEXT_PUBLIC_MEDIAMTX_HLS_URL=http://localhost/hls
```

## Learn More

- Full documentation: [MONITORING.md](MONITORING.md)
- Dashboard customization: See Grafana docs
- Metric queries: See Prometheus docs
- MediaMTX configuration: [mediamtx.yml](mediamtx.yml)
