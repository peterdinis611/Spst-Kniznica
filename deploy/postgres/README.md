# PostgreSQL (database per service)

## Lokálne

```bash
docker compose up -d postgres
# Init script vytvorí: spst_book, spst_booking, spst_author, spst_category,
# spst_email, spst_admin, spst_auth, spst_messaging
```

V root `.env`:

```bash
Database__Provider=PostgreSql
Database__Postgres__Host=127.0.0.1
Database__Postgres__Port=5432
Database__Postgres__Username=spst
Database__Postgres__Password=spst
# Database name ostáva v appsettings každej služby (spst_booking, …)
```

Potom `./start.sh` — EF `Migrate` vytvorí schému (existujúce migrácie používajú TEXT typy, PG ich akceptuje).

Späť na SQLite: `Database__Provider=Sqlite` alebo vyhoď riadok.

## Záloha

```bash
./scripts/pg-backup.sh
./scripts/pg-restore.sh .backups/pg-YYYYMMDD-HHMMSS
```

## Migrácia dát zo SQLite

```bash
./stop.sh
docker compose up -d postgres
# vytvor schému: krátky štart s Database__Provider=PostgreSql, alebo EF Migrate
./scripts/sqlite-to-postgres.sh   # vyžaduje pgloader (brew) alebo Docker
# .env → Database__Provider=PostgreSql
./start.sh
```

`pgloader` skopíruje riadky do existujúcich DB (`spst_book`, …). Ak cieľová tabuľka ešte neexistuje, nechaj najprv bežať služby raz (Migrate), potom ETL.

## Produkcia

- Managed Postgres alebo vlastný server
- Silné heslo, TLS: `Database__Postgres__SslMode=Require` (overlay default)
- `Database__Provider=PostgreSql`
- Denný backup + PITR podľa hostingu
- Jedna DB na službu — žiadne cross-service JOIN-y
- Pred deploy: `./scripts/check-production-secrets.sh` + `./scripts/check-production-overlays.sh`
