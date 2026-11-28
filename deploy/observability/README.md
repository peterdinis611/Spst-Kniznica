# Observability (Prometheus + Grafana)

Lokálny monitoring nad existujúcimi `/metrics?format=prom` endpointmi (.NET `RequestMetrics`).

## Štart

```bash
# infra + monitoring
docker compose --profile observability up -d

# alebo len monitoring (Redis/Postgres už bežia)
docker compose --profile observability up -d prometheus grafana

# aplikačný stack
./start.sh --detach
```

| Služba     | URL                         | Login (local)   |
|------------|-----------------------------|-----------------|
| Grafana    | http://127.0.0.1:3001       | `admin` / `admin` |
| Prometheus | http://127.0.0.1:9090       | —               |

Dashboard **SPST Knižnica — overview** je predprovisionovaný (folder SPST).

## Čo sa scrapuje

Z kontajnerov cez `host.docker.internal` (služby bežia na hoste cez `./start.sh`):

- Gateway `:5200`
- Book `:5203`
- Booking `:5208`
- Workers `:5209`
- Email `:5212`

Targets: `deploy/observability/prometheus.yml`.

## Production / locked metrics

Keď `Metrics__RequireKey=true`, doplň do Prometheus scrape config hlavičku:

```yaml
authorization:
  credentials_file: /etc/prometheus/metrics_token
```

alebo `X-Metrics-Key` (pozri komentár v `prometheus.yml`). Token = `Metrics__ApiKey` / `InternalApi__SharedKey`.

## Metriky

| Meno | Typ |
|------|-----|
| `spst_http_requests_total` | counter |
| `spst_http_responses_{2xx,4xx,429,5xx}_total` | counter |
| `spst_http_avg_duration_ms` | gauge |
| `spst_process_working_set_bytes` | gauge |
| `spst_uptime_seconds` | gauge |
| `spst_custom_*` | outbox / audit / email gauges + counters |

## Stop

```bash
docker compose --profile observability stop prometheus grafana
```
