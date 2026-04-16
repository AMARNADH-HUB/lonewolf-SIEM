from collections import defaultdict, deque
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from .models import Alert, Event


class DetectionEngine:
    def __init__(self):
        self.failed_ssh = defaultdict(deque)
        self.sudo_spikes = defaultdict(deque)

    def evaluate(self, db: Session, event: Event) -> None:
        msg = event.message.lower()
        now = datetime.utcnow()

        if "failed password" in msg or "authentication failure" in msg:
            bucket = self.failed_ssh[event.host]
            bucket.append(now)
            self._trim(bucket, now - timedelta(minutes=5))
            if len(bucket) >= 5:
                db.add(
                    Alert(
                        rule_name="SSH Brute Force",
                        mitre_tag="T1110",
                        host=event.host,
                        severity="high",
                        message=f"{len(bucket)} failed auth attempts in 5 minutes on {event.host}",
                    )
                )
                bucket.clear()

        if "sudo" in msg and ("incorrect password" in msg or "session opened" in msg):
            bucket = self.sudo_spikes[event.host]
            bucket.append(now)
            self._trim(bucket, now - timedelta(minutes=10))
            if len(bucket) >= 10:
                db.add(
                    Alert(
                        rule_name="Sudo Usage Spike",
                        mitre_tag="T1548",
                        host=event.host,
                        severity="medium",
                        message=f"Unusual sudo activity detected on {event.host}",
                    )
                )
                bucket.clear()

        if "invalid user" in msg or "account is disabled" in msg:
            db.add(
                Alert(
                    rule_name="Disabled/Invalid User Login Attempt",
                    mitre_tag="T1078",
                    host=event.host,
                    severity="medium",
                    message=f"Invalid/disabled account login attempt observed on {event.host}",
                )
            )

    @staticmethod
    def _trim(queue: deque, threshold: datetime) -> None:
        while queue and queue[0] < threshold:
            queue.popleft()


engine = DetectionEngine()
