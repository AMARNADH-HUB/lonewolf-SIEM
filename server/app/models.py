from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    host: Mapped[str] = mapped_column(String(128), index=True)
    source: Mapped[str] = mapped_column(String(128), default="unknown", index=True)
    severity: Mapped[str] = mapped_column(String(32), default="info", index=True)
    message: Mapped[str] = mapped_column(Text)
    raw: Mapped[str] = mapped_column(Text, default="{}")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    rule_name: Mapped[str] = mapped_column(String(128), index=True)
    mitre_tag: Mapped[str] = mapped_column(String(64), default="T0000")
    host: Mapped[str] = mapped_column(String(128), index=True)
    severity: Mapped[str] = mapped_column(String(32), default="medium", index=True)
    message: Mapped[str] = mapped_column(Text)


class HostHeartbeat(Base):
    __tablename__ = "host_heartbeats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    host: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    ip: Mapped[str] = mapped_column(String(64), default="")
    agent_version: Mapped[str] = mapped_column(String(32), default="1.0.0")
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
