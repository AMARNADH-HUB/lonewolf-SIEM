from datetime import datetime
from pathlib import Path
import sys
from types import SimpleNamespace

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.rules import DetectionEngine


class DummyDB:
    def __init__(self):
        self.alerts = []

    def add(self, obj):
        self.alerts.append(obj)


def make_event(msg: str, host: str = "linux-01"):
    return SimpleNamespace(
        host=host,
        source="auth.log",
        severity="warning",
        message=msg,
        raw="{}",
        created_at=datetime.utcnow(),
    )


def test_invalid_user_generates_alert():
    engine = DetectionEngine()
    db = DummyDB()
    engine.evaluate(db, make_event("sshd: Invalid user test from 10.0.0.10"))
    assert len(db.alerts) == 1
    assert db.alerts[0].rule_name == "Disabled/Invalid User Login Attempt"
