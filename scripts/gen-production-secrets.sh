#!/usr/bin/env bash
# Print Production secret values to paste into deploy/env.production.example copy.
# Does not write files — stdout only.
set -euo pipefail

rand() {
  openssl rand -base64 48 | tr -d '\n' | tr '+/' '-_' | head -c 48
  echo
}

echo "# Paste into /etc/spst/kniznica.env (do not commit)"
echo "InternalApi__SharedKey=$(rand)"
echo "Metrics__ApiKey=$(rand)"
echo "Kafka__SigningSecret=$(rand)"
echo "RabbitMq__SigningSecret=$(rand)"
echo "Database__Postgres__Password=$(rand)"
echo "POSTGRES_PASSWORD=$(rand)"
echo "RabbitMq__Password=$(rand)"
echo "RABBITMQ_DEFAULT_PASS=$(rand)"
echo
echo "# Optional Grafana (compose profile observability)"
echo "GRAFANA_ADMIN_PASSWORD=$(rand)"
