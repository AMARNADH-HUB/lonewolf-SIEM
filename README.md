# Lonewolf SIEM

Lonewolf SIEM is a **free and open-source Linux SIEM** designed for simple deployment and real operational visibility.

It provides:
- Linux endpoint log collection (agent)
- Central ingestion, detection, and search APIs
- Attractive, responsive, interactive web dashboard
- Two-host architecture support (agents on targets + central SIEM host)

---

## 1) Full Feature List

### Core SIEM Features
- Token-based secure event ingestion (`x-agent-token`)
- Structured event storage and query APIs
- Host heartbeat tracking and online visibility
- Alert generation from built-in detection rules

### Built-in Detection Rules (v1)
- **SSH Brute Force** (`T1110`): repeated failed auth attempts
- **Sudo Usage Spike** (`T1548`): unusual burst of sudo activity
- **Disabled/Invalid User Login Attempt** (`T1078`)

### Dashboard Features
- Modern dark UI (responsive for mobile/tablet/desktop)
- Live polling for events, alerts, and host health
- Severity filtering for event triage
- Alert severity pie chart and summary cards
- Drill-down style tables for recent alerts/events

### Deployment & Usability
- Docker Compose stack for central SIEM host
- Agent can run directly with Python or as systemd service
- Demo data and seed script for fast evaluation
- Open repo and MIT license for community usage

---

## 2) Technical Specifications

### Tech Stack
- **Backend API**: Python, FastAPI
- **ORM/DB layer**: SQLAlchemy
- **Database**: PostgreSQL (default in Compose), SQLite fallback for local dev
- **Cache/Queue**: Redis (enabled in deployment for expansion)
- **Dashboard**: React + Vite + Tailwind + Recharts
- **Agent**: Python log collector/forwarder

### API Endpoints
- `GET /api/health`
- `POST /api/ingest/events` (agent token required)
- `POST /api/ingest/heartbeat` (agent token required)
- `GET /api/events`
- `GET /api/alerts`
- `GET /api/hosts`
- `GET /api/stats/alerts`

### Data Model
- `events`: normalized event records
- `alerts`: rule-triggered security findings
- `host_heartbeats`: host liveness and agent version status

---

## 3) End-to-End Workflow

1. Linux agent tails logs (`/var/log/auth.log`, `/var/log/syslog`) and builds structured events.
2. Agent sends heartbeat + event batches to central SIEM API.
3. API validates token, stores events, and runs detection engine.
4. Matching rules create alerts in alerts table.
5. Dashboard polls API and renders live operational/security view.

Flow:

`Linux Host(s) -> Agent -> /api/ingest/* -> DB + Rule Engine -> Alerts -> Dashboard`

---

## 4) Project Structure

```text
server/
  app/
    config.py        # Environment configuration
    db.py            # SQLAlchemy engine/session
    models.py        # Event/Alert/Host tables
    schemas.py       # Request/response models
    rules.py         # Detection engine
    main.py          # FastAPI routes
  tests/
    test_rules.py    # Rule unit tests
  seed_demo.py       # Seed sample events/alerts

agent/
  lonewolf_agent.py  # Collector + forwarder
  install-systemd.sh # Optional systemd installer

dashboard/
  src/App.jsx        # Main interactive UI

deploy/
  docker-compose.yml
  server.Dockerfile
  dashboard.Dockerfile
  .env.example

docs/
  architecture.md
```

---

## 5) Step-by-Step Installation (Complete)

## A. Prerequisites

### Central SIEM Host
- Docker + Docker Compose
- Git

### Linux Agent Host(s)
- Python 3.10+
- Access to `/var/log/auth.log` and `/var/log/syslog`
- Network reachability to SIEM API host/port

---

## B. Clone Repository

```bash
git clone https://github.com/AMARNADH-HUB/lonewolf-SIEM.git
cd lonewolf-SIEM
```

---

## C. Configure Environment (Central Host)

### Windows PowerShell / CMD
```bash
copy deploy\.env.example deploy\.env
```

### Linux/macOS
```bash
cp deploy/.env.example deploy/.env
```

Edit `deploy/.env` if needed:
- `SIEM_DATABASE_URL`
- `SIEM_AGENT_INGEST_TOKEN`
- `VITE_API_BASE`

---

## D. Start Central Stack

```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up --build
```

Services:
- API docs: `http://localhost:8000/docs`
- Dashboard: `http://localhost:5173`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

---

## E. Optional Demo Data (Central Host)

If you want dashboard data immediately:

```bash
python -m pip install -r server/requirements.txt
python server/seed_demo.py
```

---

## F. Install and Run Agent on Linux Endpoint

Copy or clone repo on endpoint host, then:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r agent/requirements.txt
python agent/lonewolf_agent.py --server-url http://<SIEM_SERVER_IP>:8000 --token <YOUR_AGENT_TOKEN>
```

### Agent Demo Mode (synthetic events)
```bash
python agent/lonewolf_agent.py --server-url http://<SIEM_SERVER_IP>:8000 --token <YOUR_AGENT_TOKEN> --demo
```

### Agent as systemd service
```bash
sudo bash agent/install-systemd.sh http://<SIEM_SERVER_IP>:8000 <YOUR_AGENT_TOKEN> <ABSOLUTE_PATH_TO_AGENT_DIR>
```

---

## 6) Validation Checklist

- `GET /api/health` returns `status: ok`
- `/api/hosts` shows Linux endpoint heartbeat
- `/api/events` receives logs
- `/api/alerts` populates when rule conditions match
- Dashboard cards/tables/charts refresh automatically

---

## 7) Local Development Workflow

### Backend only
```bash
python -m pip install -r server/requirements.txt
uvicorn server.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend only
```bash
cd dashboard
npm install
npm run dev
```

---

## 8) Testing

```bash
python -m pip install -r server/requirements.txt
python -m pytest server/tests -q
```

---

## 9) Troubleshooting

- **401 Invalid agent token**: Ensure agent token matches `SIEM_AGENT_INGEST_TOKEN` in `.env`
- **No alerts**: Use `--demo` mode first to verify detection flow
- **Dashboard empty**: Verify API reachable at `VITE_API_BASE`
- **Docker startup issues**: check service logs
  ```bash
  docker compose -f deploy/docker-compose.yml logs -f
  ```

---

## 10) Security Notes

- Never commit `.env` files or PAT tokens
- Rotate agent tokens regularly
- Use HTTPS/TLS and network segmentation in production
- Use least privilege on host log access

---

## 11) License

MIT License — free for everyone to use, modify, and distribute.
