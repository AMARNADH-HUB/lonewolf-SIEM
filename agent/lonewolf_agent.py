import argparse
import json
import socket
import time
from datetime import datetime
from pathlib import Path

import requests


def get_hostname() -> str:
    return socket.gethostname()


def get_primary_ip() -> str:
    try:
        return socket.gethostbyname(socket.gethostname())
    except Exception:
        return ""


def tail_file(path: Path, state: dict):
    if not path.exists():
        return []

    inode = str(path.stat().st_ino)
    pos = state.get(inode, 0)
    lines = []
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        f.seek(pos)
        for line in f:
            lines.append(line.rstrip("\n"))
        state[inode] = f.tell()
    return lines


def post_heartbeat(server_url: str, token: str):
    payload = {
        "host": get_hostname(),
        "ip": get_primary_ip(),
        "agent_version": "1.0.0",
    }
    requests.post(
        f"{server_url}/api/ingest/heartbeat",
        headers={"x-agent-token": token},
        json=payload,
        timeout=8,
    )


def post_events(server_url: str, token: str, events: list[dict]):
    if not events:
        return
    requests.post(
        f"{server_url}/api/ingest/events",
        headers={"x-agent-token": token},
        json={"events": events},
        timeout=12,
    )


def build_event(source: str, message: str) -> dict:
    return {
        "host": get_hostname(),
        "source": source,
        "severity": "warning" if "fail" in message.lower() else "info",
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
    }


def run(server_url: str, token: str, interval: int, demo: bool):
    tracked_files = [Path("/var/log/auth.log"), Path("/var/log/syslog")]
    state_file = Path(".lonewolf-agent-state.json")
    if state_file.exists():
        state = json.loads(state_file.read_text(encoding="utf-8"))
    else:
        state = {}

    print(f"[agent] sending logs to {server_url}")
    while True:
        try:
            post_heartbeat(server_url, token)
            batch = []

            if demo:
                batch.append(build_event("demo", "Failed password for invalid user admin from 10.10.1.50"))
                batch.append(build_event("demo", "sudo: session opened for user root by ubuntu"))
            else:
                for f in tracked_files:
                    for line in tail_file(f, state):
                        if line.strip():
                            batch.append(build_event(str(f), line))

            post_events(server_url, token, batch)
            state_file.write_text(json.dumps(state), encoding="utf-8")
        except Exception as ex:
            print(f"[agent] warning: {ex}")

        time.sleep(interval)


def parse_args():
    parser = argparse.ArgumentParser(description="Lonewolf Linux SIEM Agent")
    parser.add_argument("--server-url", required=True, help="SIEM server URL, e.g. http://10.0.0.5:8000")
    parser.add_argument("--token", required=True, help="Agent ingest token")
    parser.add_argument("--interval", type=int, default=10, help="Polling interval seconds")
    parser.add_argument("--demo", action="store_true", help="Send synthetic events")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run(args.server_url.rstrip("/"), args.token, args.interval, args.demo)
