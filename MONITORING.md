# MediaMTX Dashboard Monitoring Setup

This document describes the monitoring infrastructure setup for the MediaMTX dashboard.

## Overview

The monitoring stack consists of:
- **Prometheus**: Time-series database for metrics collection
- **Node Exporter**: System-level metrics (CPU, memory, disk, network)
- **Grafana**: Visualization and dashboarding
- **MediaMTX Metrics**: Application-level streaming metrics

## Architecture

```
┌─────────────────┐
│   MediaMTX      │──────┐
│   (Publisher)   │      │
│   Port: 9998    │      │ Metrics
└─────────────────┘      │
                         │
┌─────────────────┐      │
│  Node Exporter  │──────┤
│   Port: 9100    │      │
└─────────────────┘      │
                         │
                         ▼
                  ┌─────────────┐
                  │ Prometheus  │
                  │ Port: 9090  │
                  └──────┬──────┘
                         │
                         │ Data Source
                         │
                         ▼
                  ┌─────────────┐
                  │   Grafana   │
                  │ Port: 3001  │
                  └─────────────┘
```

## Components

### 1. MediaMTX Metrics

**Configuration File**: `mediamtx.yml`

MediaMTX provides Prometheus-compatible metrics on port 9998. The following metrics are enabled:

- `metrics: yes` - Enables metrics collection
- `metricsAddress: :9998` - Metrics endpoint

**Available Metrics**:
- `mediamtx_paths` - Number of active streaming paths
- `mediamtx_hls_muxers` - Number of HLS muxers
- `mediamtx_rtsp_conns` - Number of RTSP connections
- `mediamtx_rtmp_conns` - Number of RTMP connections
- `mediamtx_webrtc_sessions` - Number of WebRTC sessions
- `mediamtx_paths_bytes_received` - Bytes received per path
- `mediamtx_paths_bytes_sent` - Bytes sent per path
- `mediamtx_paths_readers` - Number of readers per path

### 2. Prometheus

**Configuration File**: `prometheus.yml`

Prometheus scrapes metrics from three sources every 10 seconds:

```yaml
scrape_configs:
  - job_name: prometheus          # Prometheus self-monitoring
    static_configs:
      - targets: ['prometheus_mediamtx:9090']

  - job_name: node-exporter       # System metrics
    static_configs:
      - targets: ['node-exporter_mediamtx:9100']

  - job_name: mediamtx            # MediaMTX streaming metrics
    static_configs:
      - targets: ['publisher:9998']
```

**Access**:
- Direct: `http://localhost:9090`
- Via Nginx: `http://localhost/monitoring/`

### 3. Node Exporter

Provides system-level metrics including:
- CPU usage
- Memory usage
- Disk usage and I/O
- Network traffic
- System uptime

**Access**: `http://localhost:9100/metrics`

### 4. Grafana

**Configuration**: `grafana/provisioning/`

Grafana is pre-configured with:
- Prometheus datasource (auto-provisioned)
- Two pre-built dashboards:
  - **MediaMTX Dashboard**: Application metrics
  - **System Metrics Dashboard**: Node Exporter metrics

**Default Credentials**:
- Username: `admin`
- Password: `admin`

**Access**:
- Direct: `http://localhost:3001`
- Via Nginx: `http://localhost/grafana/`

## Dashboards

### MediaMTX Dashboard

Located at: `grafana/provisioning/dashboards/mediamtx-dashboard.json`

**Panels**:
1. **Active Paths** - Current number of streaming paths
2. **HLS Muxers** - Number of HLS multiplexers
3. **RTSP Connections** - Active RTSP connections
4. **WebRTC Sessions** - Active WebRTC sessions
5. **Bytes Received Rate** - Incoming bandwidth per path
6. **Bytes Sent Rate** - Outgoing bandwidth per path
7. **Readers per Path** - Number of consumers per stream
8. **RTMP Connections** - Active RTMP connections

**Features**:
- Auto-refresh every 5 seconds
- 15-minute time window
- Dark theme

### System Metrics Dashboard

Located at: `grafana/provisioning/dashboards/node-exporter-dashboard.json`

**Panels**:
1. **CPU Usage** - System CPU utilization
2. **Memory Usage** - RAM consumption
3. **Disk Usage** - Storage utilization
4. **System Uptime** - Time since last boot
5. **Network Traffic** - RX/TX per interface
6. **Disk I/O** - Read/write throughput

**Features**:
- Auto-refresh every 5 seconds
- 15-minute time window
- Color-coded thresholds (Green/Yellow/Red)

## Deployment

### Using Docker Compose

Start the entire monitoring stack:

```bash
docker-compose up -d
```

This will start:
- `prometheus_mediamtx` on port 9090
- `node-exporter_mediamtx` on port 9100
- `grafana_mediamtx` on port 3001
- `publisher` (MediaMTX) with metrics on port 9998

### Accessing Services

1. **Grafana Dashboard**: 
   - URL: `http://localhost:3001`
   - Login with `admin/admin`
   - Navigate to Dashboards → Browse

2. **Prometheus UI**:
   - URL: `http://localhost:9090`
   - Query metrics directly

3. **Via Nginx Reverse Proxy**:
   - Grafana: `http://localhost/grafana/`
   - Prometheus: `http://localhost/monitoring/`
   - Node Exporter: `http://localhost/metrics/`

## Monitoring Workflow

1. **MediaMTX** exposes metrics on `:9998/metrics`
2. **Node Exporter** exposes system metrics on `:9100/metrics`
3. **Prometheus** scrapes both endpoints every 10 seconds
4. **Grafana** queries Prometheus and displays visualizations
5. **Nginx** provides unified access through reverse proxy

## Configuration Files

| File | Purpose |
|------|---------|
| `mediamtx.yml` | MediaMTX configuration with metrics enabled |
| `prometheus.yml` | Prometheus scrape configuration |
| `docker-compose.yml` | Container orchestration |
| `grafana/provisioning/datasources.yml` | Grafana datasource config |
| `grafana/provisioning/dashboards.yml` | Dashboard provisioning config |
| `grafana/provisioning/dashboards/*.json` | Pre-built dashboard definitions |
| `nginx/nginx.conf` | Reverse proxy configuration |

## Customization

### Adding New Metrics

1. Edit `prometheus.yml` to add new scrape targets
2. Restart Prometheus: `docker-compose restart prometheus_mediamtx`

### Creating Custom Dashboards

1. Access Grafana at `http://localhost:3001`
2. Create new dashboard via UI
3. Export JSON and save to `grafana/provisioning/dashboards/`
4. Dashboards auto-load on container restart

### Adjusting Scrape Intervals

Edit `prometheus.yml`:
```yaml
global:
  scrape_interval: 10s  # Change to desired interval
```

### Modifying Alert Thresholds

Edit dashboard JSON files and adjust threshold values in panel configurations.

## Troubleshooting

### Metrics Not Showing

1. **Check MediaMTX metrics are enabled**:
   ```bash
   curl http://localhost:9998/metrics
   ```

2. **Verify Prometheus is scraping**:
   - Open `http://localhost:9090/targets`
   - All targets should show "UP"

3. **Check Grafana datasource**:
   - Grafana → Configuration → Data Sources
   - Test connection to Prometheus

### Grafana Shows No Data

1. **Verify time range**: Check dashboard time picker (default: last 15 minutes)
2. **Check Prometheus queries**: Use Prometheus UI to verify metrics exist
3. **Verify datasource UID**: Should be "prometheus" in dashboard JSON

### Container Issues

```bash
# View logs
docker-compose logs prometheus_mediamtx
docker-compose logs grafana_mediamtx
docker-compose logs node-exporter_mediamtx

# Restart services
docker-compose restart prometheus_mediamtx grafana_mediamtx

# Rebuild if needed
docker-compose up -d --build
```

### Permission Issues

If Grafana has permission errors:
```bash
# Fix grafana data permissions
sudo chown -R 472:472 grafana_data/
```

## Security Considerations

1. **Change Default Passwords**: 
   - Modify `GF_SECURITY_ADMIN_PASSWORD` in `docker-compose.yml`

2. **Network Exposure**: 
   - Monitoring ports are exposed by default for development
   - In production, remove port mappings and access via Nginx only

3. **Authentication**:
   - MediaMTX API requires authentication (configured in `mediamtx.yml`)
   - Consider adding authentication to Nginx for metrics endpoints

4. **HTTPS**:
   - Enable TLS/SSL in production
   - Configure nginx with certificates

## Performance Optimization

1. **Retention Period**: 
   - Default Prometheus retention is 15 days
   - Adjust with `--storage.tsdb.retention.time` flag

2. **Scrape Interval**:
   - Lower intervals (e.g., 5s) increase precision but use more resources
   - Higher intervals (e.g., 30s) reduce load

3. **Dashboard Refresh**:
   - Default is 5s auto-refresh
   - Increase to reduce browser load

## Backup and Recovery

### Backup Prometheus Data

```bash
docker run --rm -v prometheus_data:/prometheus \
  -v $(pwd)/backup:/backup alpine \
  tar czf /backup/prometheus-backup.tar.gz /prometheus
```

### Backup Grafana Data

```bash
docker run --rm -v grafana_data:/grafana \
  -v $(pwd)/backup:/backup alpine \
  tar czf /backup/grafana-backup.tar.gz /grafana
```

### Restore

```bash
# Restore Prometheus
docker run --rm -v prometheus_data:/prometheus \
  -v $(pwd)/backup:/backup alpine \
  tar xzf /backup/prometheus-backup.tar.gz -C /

# Restore Grafana
docker run --rm -v grafana_data:/grafana \
  -v $(pwd)/backup:/backup alpine \
  tar xzf /backup/grafana-backup.tar.gz -C /
```

## Monitoring Best Practices

1. **Set Up Alerts**: Configure Grafana alerts for critical metrics
2. **Monitor Trends**: Review weekly/monthly trends for capacity planning
3. **Document Changes**: Keep track of configuration modifications
4. **Regular Backups**: Schedule automated backups of Prometheus and Grafana data
5. **Test Disaster Recovery**: Periodically test backup restoration

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Node Exporter Metrics](https://github.com/prometheus/node_exporter)
- [MediaMTX Documentation](https://github.com/bluenviron/mediamtx)

## Support

For issues or questions:
1. Check container logs: `docker-compose logs [service_name]`
2. Verify all services are running: `docker-compose ps`
3. Review this documentation
4. Open an issue on the GitHub repository
