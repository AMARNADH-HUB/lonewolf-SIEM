#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <SERVER_URL> <TOKEN> <AGENT_DIR>"
  exit 1
fi

SERVER_URL="$1"
TOKEN="$2"
AGENT_DIR="$3"

cat >/etc/systemd/system/lonewolf-agent.service <<SERVICE
[Unit]
Description=Lonewolf SIEM Linux Agent
After=network.target

[Service]
Type=simple
WorkingDirectory=${AGENT_DIR}
ExecStart=${AGENT_DIR}/.venv/bin/python ${AGENT_DIR}/lonewolf_agent.py --server-url ${SERVER_URL} --token ${TOKEN}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable --now lonewolf-agent.service
echo "lonewolf-agent installed and started"
