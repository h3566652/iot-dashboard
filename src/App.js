import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './App.css';

const API_BASE = 'https://p8ng1t28m3.execute-api.ap-northeast-2.amazonaws.com';

function App() {
  const [latest, setLatest]     = useState(null);
  const [history, setHistory]   = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      const [latestRes, historyRes, anomalyRes] = await Promise.all([
        fetch(`${API_BASE}/sensors/latest`),
        fetch(`${API_BASE}/sensors/history`),
        fetch(`${API_BASE}/anomalies`)
      ]);

      const latestData  = await latestRes.json();
      const historyData = await historyRes.json();
      const anomalyData = await anomalyRes.json();

      setLatest(latestData);
      setHistory(historyData.readings.map(r => ({
        time: new Date(r.timestamp * 1000).toLocaleTimeString(),
        temperature: r.temperature,
        humidity: r.humidity
      })));
      setAnomalies(anomalyData.anomalies);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity) => {
    if (severity === 'HIGH') return '#ff4444';
    if (severity === 'MEDIUM') return '#ffaa00';
    return '#00cc44';
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Smart Factory IoT Dashboard</h1>
        <p className="subtitle">Device: rpi-dht22-seoul-001 · Seoul, Korea</p>
        {lastUpdated && <p className="updated">Last updated: {lastUpdated}</p>}
      </header>

      {/* Latest Readings */}
      <div className="cards">
        <div className="card">
          <h2>Temperature</h2>
          <div className="value">
            {latest ? `${latest.temperature}°C` : '—'}
          </div>
          <p className="label">Current Reading</p>
        </div>
        <div className="card">
          <h2>Humidity</h2>
          <div className="value">
            {latest ? `${latest.humidity}%` : '—'}
          </div>
          <p className="label">Current Reading</p>
        </div>
        <div className="card">
          <h2>Anomaly Status</h2>
          <div
            className="value"
            style={{ color: anomalies[0] ? getSeverityColor(anomalies[0].severity) : '#00cc44' }}
          >
            {anomalies[0] ? anomalies[0].severity : 'NORMAL'}
          </div>
          <p className="label">Latest Detection</p>
        </div>
      </div>

      {/* 24h Chart */}
      <div className="chart-container">
        <h2>24-Hour Sensor History</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#aaa', fontSize: 10 }}
              interval={Math.floor(history.length / 8)}
            />
            <YAxis tick={{ fill: '#aaa' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ff6b6b"
              dot={false}
              name="Temperature (°C)"
            />
            <Line
              type="monotone"
              dataKey="humidity"
              stroke="#4ecdc4"
              dot={false}
              name="Humidity (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly Log */}
      <div className="anomaly-container">
        <h2>Recent Anomaly Detections</h2>
        {anomalies.length === 0 ? (
          <p className="normal">No anomalies detected</p>
        ) : (
          <table className="anomaly-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Severity</th>
                <th>Temperature</th>
                <th>Humidity</th>
                <th>Temp Z-Score</th>
                <th>Humidity Z-Score</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a, i) => {
                const details = JSON.parse(a.details);
                return (
                  <tr key={i}>
                    <td>{new Date(a.timestamp * 1000).toLocaleString()}</td>
                    <td style={{ color: getSeverityColor(a.severity) }}>
                      {a.severity}
                    </td>
                    <td>{details.latest_temperature}°C</td>
                    <td>{details.latest_humidity}%</td>
                    <td>{details.temp_z_score}</td>
                    <td>{details.hum_z_score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;
