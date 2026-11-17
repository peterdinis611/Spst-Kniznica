#!/usr/bin/env bash
# Vstupný bod: Docker Compose (Redis/Kafka/RabbitMQ) → .NET → Next.js.
# Pred štartom služieb vždy: docker compose up -d (vypni cez --skip-docker).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$ROOT/scripts/start-all.sh" "$@"
