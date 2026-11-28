# Deploy — školský VPS (Caddy + loopback stack)

Odporúčaný model: **jeden Linux VPS**, Docker Compose pre infra, .NET + Next na hoste, **Caddy** na TLS.  
Verejne ide len Caddy → Next `:3000`; Gateway a mikroslužby počúvajú `127.0.0.1`.

```text
Internet ──► Caddy :443 ──► Next :3000 (BFF)
                              │
                              └──► Gateway :5200 ──► Book/Booking/… (loopback)
Docker: Postgres · Redis · Kafka · RabbitMQ
```

## 1. Príprava secrets

```bash
./scripts/gen-production-secrets.sh
# skopíruj hodnoty do env súboru
cp deploy/env.production.example /etc/spst/kniznica.env   # ako root
chmod 600 /etc/spst/kniznica.env
# doplň: SITE_URL (https://…), Entra, SMTP, heslá z generátora
```

Entra: redirect URI `https://tvoja-domena/login`, API audience/scope podľa app registration.

## 2. Gate pred štartom

```bash
./scripts/check-deploy-ready.sh /etc/spst/kniznica.env
./scripts/check-production-overlays.sh
```

Musí prejsť: silný `InternalApi__SharedKey`, `https://` SITE_URL, `Database__Provider=PostgreSql`, e-mail HTML šablóny.

## 3. Infra

```bash
# v kniznica.env už máš POSTGRES_* / RABBITMQ_*
docker compose up -d postgres redis rabbitmq kafka
# voliteľne monitoring:
docker compose --profile observability up -d
```

Postgres DB vytvorí `deploy/postgres/init-databases.sql`.  
Schému doplní EF Migrate pri štarte služieb.  
Dáta zo SQLite: `./scripts/sqlite-to-postgres.sh` (pozri `deploy/postgres/README.md`).

## 4. Aplikácia

```bash
export SPST_ENV_FILE=/etc/spst/kniznica.env
./scripts/run-production.sh --detach
# ekvivalent: ./start.sh --production --detach
```

Čo urobí `--production`:

- `check-deploy-ready.sh`
- `dotnet build -c Release`
- všetky .NET služby + Gateway
- `npm run build` + `npm run start` (nie `dev`)
- bez Storybook

Stop: `./stop.sh`

## 5. Caddy (TLS)

```bash
# uprav host v deploy/caddy/Caddyfile
sudo cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

DNS A/AAAA → VPS. Caddy vystaví certifikát automaticky.

## 6. systemd (auto-start)

```bash
# kód v /opt/spst-kniznica, user spst
sudo cp deploy/systemd/spst-kniznica.service /etc/systemd/system/
# uprav paths v unit súbore ak treba
sudo systemctl daemon-reload
sudo systemctl enable --now spst-kniznica.service
```

## 7. Go-live checklist

- [ ] `check-deploy-ready.sh` OK  
- [ ] `https://domena` otvára katalóg  
- [ ] Entra login (staff)  
- [ ] Checkout/return pošle e-mail (SMTP) alebo log-only zámerne  
- [ ] `curl -fsS https://domena/api/...` cez BFF  
- [ ] Gateway ready: `curl -fsS http://127.0.0.1:5200/health/ready`  
- [ ] Denný `./scripts/pg-backup.sh` (cron/launchd)  
- [ ] Metrics za kľúčom (`X-Metrics-Key`)

## Súbory

| Path | Účel |
|------|------|
| `deploy/env.production.example` | Template secrets/URL |
| `deploy/caddy/Caddyfile` | TLS reverse proxy |
| `deploy/systemd/spst-kniznica.service` | Boot unit |
| `scripts/gen-production-secrets.sh` | openssl secrets |
| `scripts/check-deploy-ready.sh` | Hard gate |
| `scripts/run-production.sh` | Production start |

## Čo ešte nie je

- Multi-node / Kubernetes  
- Container images pre .NET/Next (zámerne host-run)  
- Managed PaaS one-click  

Ak treba iný model (Docker-all-in-one), povedz — doplníme compose profile `app`.
