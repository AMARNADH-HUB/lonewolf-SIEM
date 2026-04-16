from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class EventIn(BaseModel):
    host: str = Field(..., min_length=1)
    source: str = "unknown"
    severity: str = "info"
    message: str
    timestamp: Optional[datetime] = None


class EventBatchIn(BaseModel):
    events: List[EventIn]


class HeartbeatIn(BaseModel):
    host: str
    ip: str = ""
    agent_version: str = "1.0.0"


class EventOut(BaseModel):
    id: int
    created_at: datetime
    host: str
    source: str
    severity: str
    message: str

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    created_at: datetime
    rule_name: str
    mitre_tag: str
    host: str
    severity: str
    message: str

    class Config:
        from_attributes = True


class HostOut(BaseModel):
    host: str
    ip: str
    agent_version: str
    last_seen: datetime

    class Config:
        from_attributes = True
