-- Creates one database per microservice (database-per-service).
-- Runs once on first `docker compose up` via docker-entrypoint-initdb.d.
-- User/password come from POSTGRES_USER / POSTGRES_PASSWORD (default: spst/spst).

SELECT 'Creating SPST service databases…';

CREATE DATABASE spst_book;
CREATE DATABASE spst_booking;
CREATE DATABASE spst_author;
CREATE DATABASE spst_category;
CREATE DATABASE spst_email;
CREATE DATABASE spst_admin;
CREATE DATABASE spst_auth;
CREATE DATABASE spst_messaging;
