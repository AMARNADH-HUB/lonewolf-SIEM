from datetime import datetime

from app.db import SessionLocal
from app.models import Alert, Event, HostHeartbeat


def run():
    db = SessionLocal()
    try:
        db.add_all(
            [
                Event(
                    host="linux-01",
                    source="auth.log",
                    severity="warning",
                    message="Failed password for invalid user admin from 192.168.1.50",
                    raw="{}",
                    created_at=datetime.utcnow(),
                ),
                Event(
                    host="linux-02",
                    source="sudo",
                    severity="info",
                    message="sudo: session opened for user root by ubuntu",
                    raw="{}",
                    created_at=datetime.utcnow(),
                ),
                Alert(
                    rule_name="SSH Brute Force",
                    mitre_tag="T1110",
                    host="linux-01",
                    severity="high",
                    message="5 failed auth attempts in 5 minutes on linux-01",
                    created_at=datetime.utcnow(),
                ),
                HostHeartbeat(
                    host="linux-01",
                    ip="192.168.1.11",
                    agent_version="1.0.0",
                    last_seen=datetime.utcnow(),
                ),
            ]
        )
        db.commit()
        print("Seed data inserted")
    finally:
        db.close()


if __name__ == "__main__":
    run()
