import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const PIE_COLORS = {
  high: "#ff5f7b",
  medium: "#ffd166",
  low: "#49e7ff",
};

const TONE_CLASS = {
  critical: "tone-critical",
  warning: "tone-warning",
  info: "tone-info",
  high: "tone-critical",
  medium: "tone-warning",
  low: "tone-info",
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "rgba(3, 15, 34, 0.95)",
  border: "1px solid rgba(73, 220, 255, 0.6)",
  borderRadius: "10px",
  color: "#d8f8ff",
};

function usePolling(url, interval = 5000) {
  const [data, setData] = useState([]);

  useEffect(() => {
    let stop = false;

    async function poll() {
      try {
        const res = await fetch(url);
        const json = await res.json();
        if (!stop) setData(json);
      } catch {
        if (!stop) setData([]);
      }
    }

    poll();
    const id = setInterval(poll, interval);

    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [url, interval]);

  return data;
}

function toToneClass(severity) {
  const key = (severity || "info").toLowerCase();
  return TONE_CLASS[key] || "tone-info";
}

function formatClock(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function shortLabel(value, max = 14) {
  if (!value) return "unknown";
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function App() {
  const events = usePolling(`${API_BASE}/api/events?limit=120`);
  const alerts = usePolling(`${API_BASE}/api/alerts?limit=80`);
  const hosts = usePolling(`${API_BASE}/api/hosts`);
  const stats = usePolling(`${API_BASE}/api/stats/alerts`, 8000);

  const alertTotals = useMemo(() => {
    const base = { high: 0, medium: 0, low: 0 };

    if (stats && !Array.isArray(stats) && stats.by_severity) {
      return {
        high: Number(stats.by_severity.high || 0),
        medium: Number(stats.by_severity.medium || 0),
        low: Number(stats.by_severity.low || 0),
      };
    }

    return alerts.reduce((acc, alert) => {
      const key = (alert.severity || "").toLowerCase();
      if (key in acc) acc[key] += 1;
      return acc;
    }, base);
  }, [alerts, stats]);

  const totalAlerts = useMemo(() => {
    if (stats && !Array.isArray(stats) && typeof stats.total === "number") {
      return stats.total;
    }
    return alerts.length;
  }, [alerts.length, stats]);

  const liveEvents = useMemo(() => events.slice(0, 12), [events]);

  const playbooks = useMemo(() => alerts.slice(0, 7), [alerts]);

  const pieData = useMemo(
    () =>
      Object.entries(alertTotals).map(([level, value]) => ({
        level,
        name: level.toUpperCase(),
        value,
      })),
    [alertTotals]
  );

  const severityRows = useMemo(() => {
    const total = Math.max(
      1,
      Object.values(alertTotals).reduce((sum, value) => sum + value, 0)
    );

    return ["high", "medium", "low"].map((level) => ({
      level,
      count: alertTotals[level],
      percent: Math.round((alertTotals[level] / total) * 100),
    }));
  }, [alertTotals]);

  const trafficData = useMemo(() => {
    const buckets = {};

    [...events]
      .slice(0, 120)
      .reverse()
      .forEach((event) => {
        const date = new Date(event.created_at);
        if (Number.isNaN(date.getTime())) return;

        const key = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        buckets[key] = (buckets[key] || 0) + 1;
      });

    return Object.entries(buckets)
      .slice(-10)
      .map(([time, count]) => ({ time, count }));
  }, [events]);

  const sourceData = useMemo(() => {
    const sourceCounts = {};

    events.slice(0, 120).forEach((event) => {
      const key = shortLabel(event.source || "unknown", 12);
      sourceCounts[key] = (sourceCounts[key] || 0) + 1;
    });

    return Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .reverse()
      .map(([source, count]) => ({ source, count }));
  }, [events]);

  const averageEventsPerSlice = useMemo(() => {
    if (!trafficData.length) return 0;
    const total = trafficData.reduce((sum, item) => sum + item.count, 0);
    return Math.round(total / trafficData.length);
  }, [trafficData]);

  return (
    <div className="neon-scene">
      <div className="scene-grid" />
      <div className="moon-orb" />
      <div className="city-glow" />

      <main className="dashboard-console">
        <header className="console-header">
          <div className="title-block">
            <p className="title-kicker">Live Security Operations • Night Watch</p>
            <h1>LONEWOLF-SIEM</h1>
          </div>

          <div className="module-rack">
            <div className="module-card">
              <span>Module</span>
              <strong>Integrated</strong>
            </div>
            <div className="module-card">
              <span>Hosts</span>
              <strong>{hosts.length}</strong>
            </div>
            <div className="module-card">
              <span>Telemetry</span>
              <strong>{events.length}</strong>
            </div>
          </div>
        </header>

        <section className="console-grid-layout">
          <article className="neon-panel panel-live">
            <div className="panel-heading">
              <h2>Live Event Stream</h2>
              <span className="chip chip-live">Live</span>
            </div>

            <ul className="event-feed">
              {liveEvents.length ? (
                liveEvents.map((event) => (
                  <li key={event.id} className={`event-line ${toToneClass(event.severity)}`}>
                    <div className="event-line-top">
                      <span className="event-label">{(event.severity || "info").toUpperCase()}</span>
                      <span className="event-time">{formatClock(event.created_at)}</span>
                    </div>
                    <p className="event-message">{event.message}</p>
                    <small>
                      {event.host} • {event.source}
                    </small>
                  </li>
                ))
              ) : (
                <li className="empty-state">Awaiting telemetry from agents…</li>
              )}
            </ul>
          </article>

          <article className="neon-panel panel-alerts">
            <div className="panel-heading">
              <h2>Active Alerts</h2>
              <span className="panel-value">{totalAlerts}</span>
            </div>

            <div className="alert-counters">
              <div className="alert-counter level-high">
                <span>High</span>
                <strong>{alertTotals.high}</strong>
              </div>
              <div className="alert-counter level-medium">
                <span>Medium</span>
                <strong>{alertTotals.medium}</strong>
              </div>
              <div className="alert-counter level-low">
                <span>Low</span>
                <strong>{alertTotals.low}</strong>
              </div>
            </div>

            <div className="severity-bars">
              {severityRows.map((row) => (
                <div key={row.level} className="severity-row">
                  <span>{row.level}</span>
                  <div className="severity-track">
                    <div
                      className={`severity-fill level-${row.level}`}
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <strong>{row.count}</strong>
                </div>
              ))}
            </div>

            <div className="pie-shell">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={36}
                    outerRadius={58}
                    paddingAngle={4}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.level} fill={PIE_COLORS[entry.level]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="neon-panel panel-network">
            <div className="panel-heading">
              <h2>Network Traffic Map</h2>
              <span className="chip">Realtime</span>
            </div>

            <div className="network-viewport">
              <div className="network-rings" />
              <div className="network-wolf">🐺</div>
              <div className="node-badge">Sentinel Core Node</div>
            </div>

            <div className="network-stats">
              <div>
                <span>events / slice</span>
                <strong>{averageEventsPerSlice}</strong>
              </div>
              <div>
                <span>hosts online</span>
                <strong>{hosts.length}</strong>
              </div>
            </div>

            <div className="host-pills">
              {hosts.length ? (
                hosts.slice(0, 5).map((host) => <span key={host.host}>{host.host}</span>)
              ) : (
                <span>awaiting heartbeat…</span>
              )}
            </div>
          </article>

          <article className="neon-panel panel-data">
            <div className="panel-heading">
              <h2>Data Alerts</h2>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="trafficGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#46eeff" stopOpacity={0.75} />
                      <stop offset="95%" stopColor="#46eeff" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#163149" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: "#8ec6e8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#1d4863" }}
                    minTickGap={20}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#8ec6e8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#1d4863" }}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#46eeff"
                    strokeWidth={2}
                    fill="url(#trafficGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="neon-panel panel-logs">
            <div className="panel-heading">
              <h2>Log Aggregation</h2>
              <span className="panel-value">{events.length.toLocaleString()}</span>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid stroke="#163149" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="source"
                    tick={{ fill: "#8ec6e8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#1d4863" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#8ec6e8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#1d4863" }}
                  />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#8d62ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="neon-panel panel-playbooks">
            <div className="panel-heading">
              <h2>Response Playbooks</h2>
            </div>

            <ul className="playbook-feed">
              {playbooks.length ? (
                playbooks.map((alert) => (
                  <li key={alert.id}>
                    <span className={`playbook-dot ${toToneClass(alert.severity)}`} />
                    <div>
                      <p>{alert.rule_name}</p>
                      <small>
                        {alert.host} • {formatClock(alert.created_at)} • {alert.message}
                      </small>
                    </div>
                  </li>
                ))
              ) : (
                <li className="empty-state">No active alert playbooks yet…</li>
              )}
            </ul>
          </article>
        </section>

        <footer className="console-footer">
          <span>Cracking…</span>
          <div className="loading-track">
            <div className="loading-bar" />
          </div>
        </footer>
      </main>
    </div>
  );
}
