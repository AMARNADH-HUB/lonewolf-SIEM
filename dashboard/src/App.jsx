import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"];

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

export default function App() {
  const [severityFilter, setSeverityFilter] = useState("");
  const events = usePolling(`${API_BASE}/api/events?limit=100`);
  const alerts = usePolling(`${API_BASE}/api/alerts?limit=50`);
  const hosts = usePolling(`${API_BASE}/api/hosts`);
  const stats = usePolling(`${API_BASE}/api/stats/alerts`, 8000);

  const filteredEvents = useMemo(() => {
    if (!severityFilter) return events;
    return events.filter((e) => e.severity === severityFilter);
  }, [events, severityFilter]);

  const pieData = useMemo(() => {
    const base = stats.by_severity || {};
    return Object.entries(base).map(([name, value]) => ({ name, value }));
  }, [stats]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lonewolf SIEM</h1>
          <p className="text-slate-400 text-sm">Responsive, interactive Linux monitoring dashboard</p>
        </div>
        <div className="card p-2">
          <label className="text-xs text-slate-300 mr-2">Event Severity</label>
          <select
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <h2 className="font-semibold mb-2">Hosts Online</h2>
          <p className="text-3xl font-bold">{hosts.length}</p>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-2">Total Alerts</h2>
          <p className="text-3xl font-bold">{stats.total || alerts.length || 0}</p>
        </div>
        <div className="card h-48">
          <h2 className="font-semibold mb-2">Alert Severity Mix</h2>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card overflow-x-auto">
          <h2 className="font-semibold mb-3">Recent Alerts</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2">Time</th>
                <th>Rule</th>
                <th>Host</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr key={a.id} className="border-b border-slate-900">
                  <td className="py-2">{new Date(a.created_at).toLocaleString()}</td>
                  <td>{a.rule_name}</td>
                  <td>{a.host}</td>
                  <td className="capitalize">{a.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-x-auto">
          <h2 className="font-semibold mb-3">Recent Events</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-800">
                <th className="py-2">Time</th>
                <th>Host</th>
                <th>Source</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((e) => (
                <tr key={e.id} className="border-b border-slate-900">
                  <td className="py-2">{new Date(e.created_at).toLocaleString()}</td>
                  <td>{e.host}</td>
                  <td>{e.source}</td>
                  <td className="max-w-[320px] truncate" title={e.message}>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
