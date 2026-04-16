from datetime import datetime
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc
from sqlalchemy.orm import Session

from .config import settings
from .db import Base, engine as sql_engine, get_db
from .models import Alert, Event, HostHeartbeat
from .rules import engine
from .schemas import AlertOut, EventBatchIn, EventOut, HeartbeatIn, HostOut

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=sql_engine)


def verify_agent(x_agent_token: Optional[str] = Header(None)):
    if x_agent_token != settings.agent_ingest_token:
        raise HTTPException(status_code=401, detail="Invalid agent token")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": settings.app_name, "time": datetime.utcnow()}


@app.post("/api/ingest/events", dependencies=[Depends(verify_agent)])
def ingest_events(payload: EventBatchIn, db: Session = Depends(get_db)):
    inserted = 0
    for incoming in payload.events:
        evt = Event(
            host=incoming.host,
            source=incoming.source,
            severity=incoming.severity,
            message=incoming.message,
            raw=incoming.model_dump_json(),
            created_at=incoming.timestamp or datetime.utcnow(),
        )
        db.add(evt)
        db.flush()
        engine.evaluate(db, evt)
        inserted += 1

    db.commit()
    return {"inserted": inserted}


@app.post("/api/ingest/heartbeat", dependencies=[Depends(verify_agent)])
def ingest_heartbeat(payload: HeartbeatIn, db: Session = Depends(get_db)):
    host = db.query(HostHeartbeat).filter(HostHeartbeat.host == payload.host).first()
    if host:
        host.ip = payload.ip
        host.agent_version = payload.agent_version
        host.last_seen = datetime.utcnow()
    else:
        host = HostHeartbeat(
            host=payload.host,
            ip=payload.ip,
            agent_version=payload.agent_version,
            last_seen=datetime.utcnow(),
        )
        db.add(host)

    db.commit()
    return {"status": "ok"}


@app.get("/api/events", response_model=list[EventOut])
def list_events(
    db: Session = Depends(get_db),
    host: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
):
    q = db.query(Event)
    if host:
        q = q.filter(Event.host == host)
    if severity:
        q = q.filter(Event.severity == severity)
    return q.order_by(desc(Event.created_at)).limit(limit).all()


@app.get("/api/alerts", response_model=list[AlertOut])
def list_alerts(db: Session = Depends(get_db), limit: int = Query(100, ge=1, le=1000)):
    return db.query(Alert).order_by(desc(Alert.created_at)).limit(limit).all()


@app.get("/api/hosts", response_model=list[HostOut])
def list_hosts(db: Session = Depends(get_db)):
    return db.query(HostHeartbeat).order_by(desc(HostHeartbeat.last_seen)).all()


@app.get("/api/stats/alerts")
def alert_stats(db: Session = Depends(get_db)):
    alerts = db.query(Alert).all()
    by_severity = {"high": 0, "medium": 0, "low": 0}
    for a in alerts:
        by_severity[a.severity] = by_severity.get(a.severity, 0) + 1
    return {"total": len(alerts), "by_severity": by_severity}
