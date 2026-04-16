# Lonewolf SIEM

Lonewolf SIEM is a free, open-source Linux-focused SIEM with:

- **Linux agents** for log collection (journald + files)
- **Central FastAPI server** for ingestion, search, detections, and alerts
- **Responsive React dashboard** for events, alerts, and host status
- **Docker Compose deployment** for quick local/server setup

## Features (v1)

- Agent event forwarding with token auth
- Event normalization and storage
- Built-in detections:
  - SSH brute force attempts (repeated failed passwords)
  - Suspicious sudo usage spikes
  - Disabled/invalid user login attempts
- Host heartbeat tracking
- Dashboard with live refresh, filters, and charted alert stats

## Stack

- Backend: Python, FastAPI, SQLAlchemy
- DB: PostgreSQL (default in docker compose)
- Cache/queue: Redis (available for expansion)
- Frontend: React + Vite + Tailwind + Recharts
- Agent: Python (journald/file collectors)

## Quick Start

### 1) Clone

```bash
git clone https://github.com/AMARNADH-HUB/lonewolf-SIEM.git
cd lonewolf-SIEM
```

### 2) Configure environment

```bash
copy deploy\.env.example deploy\.env
```

### 3) Start central SIEM (server + postgres + redis + dashboard)

```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up --build
```

- API: `http://localhost:8000/docs`
- Dashboard: `http://localhost:5173`

### 4) Install agent on Linux endpoint

On a Linux host:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r agent/requirements.txt
python agent/lonewolf_agent.py --server-url http://<SIEM_SERVER_IP>:8000 --token dev-agent-token
```

## Project Structure

```text
server/      # FastAPI backend + rules + DB
agent/       # Linux log collection/forwarding agent
dashboard/   # React UI
deploy/      # Docker compose + Dockerfiles + env template
docs/        # Architecture and operational docs
```

## Testing

```bash
pip install -r server/requirements.txt
pytest server/tests -q
```

## License

MIT License — free for everyone to use, modify, and distribute.
