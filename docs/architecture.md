# Lonewolf SIEM Architecture

## Components

1. **Linux Agent**
   - Collects `/var/log/auth.log` and `/var/log/syslog`
   - Sends heartbeat + event batches to SIEM API

2. **SIEM API (FastAPI)**
   - Receives and stores events
   - Runs built-in detection rules
   - Exposes query APIs for dashboard

3. **Database (PostgreSQL/SQLite)**
   - `events`
   - `alerts`
   - `host_heartbeats`

4. **Dashboard (React)**
   - Visualizes events, alerts, host status
   - Live polling refresh

## Event Flow

Agent -> `/api/ingest/events` -> DB insert -> Detection Engine -> Alerts table -> Dashboard APIs

## Security Baseline

- Token-authenticated ingestion (`x-agent-token`)
- No secrets committed to repository
- `.env` driven configuration
