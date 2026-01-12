import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Petani");
  
  // State Data
  const [sensorData, setSensorData] = useState({ temperature: 0, humidity: 0 });
  const [settings, setSettings] = useState({ min_humidity: 80, mode: "otomatis", pump_status: 0 });
  const [logs, setLogs] = useState([]);
  
  // Chart Refs
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // API Config
  const API_URL = "http://localhost:3001/api";
  const getHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  // 1. CEK TOKEN & INIT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      setUserName(localStorage.getItem("username") || "Petani");
      refreshAll();

      // Auto Refresh tiap 3 detik
      const interval = setInterval(refreshAll, 3000);
      return () => clearInterval(interval);
    }
  }, [navigate]);

  const refreshAll = () => {
    fetchSensorData();
    fetchSettings();
    fetchHistory();
    fetchChartData();
  };

  // --- FETCHING DATA ---
  const fetchSensorData = async () => {
    try {
      const res = await fetch(`${API_URL}/sensor/latest`);
      const data = await res.json();
      setSensorData(data);
    } catch (e) { console.error("Sensor error"); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, { headers: getHeader() });
      const data = await res.json();
      if(res.status === 401) handleLogout(); // Token expired
      setSettings(data);
    } catch (e) { console.error("Settings error"); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/logs`, { headers: getHeader() });
      const data = await res.json();
      // Filter hanya log pompa
      const pumpLogs = data.filter(l => l.action.toLowerCase().includes("pompa"));
      setLogs(pumpLogs.slice(0, 8)); // Ambil 8 terakhir
    } catch (e) { console.error("History error"); }
  };

  // --- CHART LOGIC ---
  const fetchChartData = async () => {
    try {
      const res = await fetch(`${API_URL}/sensor/all`, { headers: getHeader() });
      const result = await res.json();
      const realData = Array.isArray(result) ? result : result.data || [];
      
      if (realData.length > 0) {
        const plotData = realData.slice(0, 15).reverse();
        updateChart(plotData);
      }
    } catch (e) { console.error(e); }
  };

  const updateChart = (data) => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map(d => new Date(d.created_at).toLocaleTimeString("id-ID")),
        datasets: [
          {
            label: "Suhu (°C)",
            data: data.map(d => d.temperature),
            borderColor: "#ff4d4d",
            backgroundColor: "rgba(255, 77, 77, 0.1)",
            fill: true,
            tension: 0.4
          },
          {
            label: "Kelembapan (%)",
            data: data.map(d => d.humidity),
            borderColor: "#007bff",
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 } }
    });
  };

  // --- CONTROL LOGIC (POMPA) ---
  const handlePumpControl = async (status) => {
    const targetMode = status === 1 ? "manual" : "otomatis";
    const actionText = status === 1 ? "MENYALAKAN (Mode Manual)" : "MEMATIKAN (Kembali ke Otomatis)";

    if (!confirm(`Apakah Anda yakin ingin ${actionText}?`)) return;

    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: { ...getHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: targetMode,
          pump_status: status,
          min_humidity: parseFloat(settings.min_humidity) || 80
        }),
      });

      if (res.ok) {
        alert("✅ Perintah Berhasil Dikirim!");
        refreshAll();
      } else {
        alert("Gagal mengirim perintah.");
      }
    } catch (e) {
      alert("Koneksi Error");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Helper untuk status pompa
  const isPumpOn = settings.pump_status === 1 || settings.pump_status === true;

  return (
    <div className="min-vh-100 bg-light font-sans">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 shadow">
        <div className="container">
          <span className="navbar-brand"><i className="bi bi-moisture me-2"></i> Panel Petani</span>
          <div className="d-flex align-items-center text-white">
            <span className="me-3">Halo, <strong>{userName}</strong></span>
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm">Keluar</button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row">
          
          {/* KOLOM KIRI (Sensor & Chart) */}
          <div className="col-md-8">
            {/* CARD SENSOR */}
            <div className="card p-4 mb-4 text-center border-0 shadow-sm">
              <h5 className="text-start text-muted mb-4"><i className="bi bi-cpu me-2"></i> Kondisi Kumbung</h5>
              <div className="row">
                <div className="col-6 border-end">
                  <p className="mb-0 text-secondary">Suhu</p>
                  <div className="display-4 fw-bold text-dark">{sensorData.temperature}°C</div>
                </div>
                <div className="col-6">
                  <p className="mb-0 text-secondary">Kelembapan</p>
                  <div className="display-4 fw-bold text-dark">{sensorData.humidity}%</div>
                </div>
              </div>
              <div className="border-top pt-3 mt-3 d-flex justify-content-between text-muted small">
                <span><i className="bi bi-info-circle"></i> Target Kelembapan: <strong>{settings.min_humidity}%</strong></span>
                <span className="badge bg-secondary">MODE: {settings.mode.toUpperCase()}</span>
              </div>
            </div>

            {/* CARD CHART */}
            <div className="card p-4 mb-4 border-0 shadow-sm">
              <h5 className="text-muted mb-3"><i className="bi bi-graph-up me-2"></i> Tren Real-Time</h5>
              <div style={{ height: "300px" }}>
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            {/* CARD HISTORY */}
            <div className="card p-4 border-0 shadow-sm">
                <h5 className="text-muted mb-3"><i className="bi bi-clock-history me-2"></i> Riwayat Pompa</h5>
                <div className="table-responsive">
                    <table className="table table-sm table-hover">
                        <thead className="table-light">
                            <tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? logs.map((log, i) => (
                                <tr key={i}>
                                    <td className="small">{new Date(log.created_at).toLocaleString("id-ID")}</td>
                                    <td>{log.full_name || 'Sistem'}</td>
                                    <td className={log.action.includes('Nyala') ? 'text-success fw-bold' : ''}>{log.action}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" className="text-center">Belum ada riwayat</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          {/* KOLOM KANAN (Kontrol Pompa) */}
          <div className="col-md-4">
            <div className="card p-4 mb-4 border-0 shadow-sm">
                <h5 className="text-muted mb-3">Kontrol Pompa</h5>
                <div className="text-center mb-4">
                    <p className="mb-2">Status Saat Ini:</p>
                    <span className={`badge p-3 w-100 rounded-pill fs-6 ${isPumpOn ? 'bg-success' : 'bg-danger'}`}>
                        {isPumpOn ? "AKTIF / MENYEMPROT" : "MATI / STANDBY"}
                    </span>
                </div>

                <div className="d-grid gap-2">
                    {isPumpOn ? (
                        <button onClick={() => handlePumpControl(0)} className="btn btn-danger btn-lg shadow">
                            <i className="bi bi-stop-circle-fill me-2"></i> MATIKAN POMPA
                        </button>
                    ) : (
                        <button onClick={() => handlePumpControl(1)} className="btn btn-success btn-lg shadow">
                            <i className="bi bi-play-circle-fill me-2"></i> NYALAKAN POMPA
                        </button>
                    )}
                </div>

                <div className="alert alert-warning mt-3 mb-0 small">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Mengontrol pompa akan mengubah sistem ke <strong>Mode Manual</strong> secara otomatis.
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserDashboard;