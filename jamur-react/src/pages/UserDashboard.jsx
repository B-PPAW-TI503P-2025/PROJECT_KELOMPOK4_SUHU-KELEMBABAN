import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Petani");
  
  // State Data (Aman dari crash)
  const [sensorData, setSensorData] = useState({ temperature: 0, humidity: 0 });
  const [settings, setSettings] = useState({ min_humidity: 80, mode: "otomatis", pump_status: 0 });
  const [logs, setLogs] = useState([]);
  
  // Chart Refs
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // --- STYLE GLASSMORPHISM (SAMA DENGAN ADMIN) ---
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "15px",
    color: "white"
  };

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
      if (data) setSensorData(data);
    } catch (e) { console.error("Sensor error"); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, { headers: getHeader() });
      const data = await res.json();
      
      if(res.status === 401) {
          handleLogout();
          return;
      }

      if (data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (e) { console.error("Settings error"); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/logs`, { headers: getHeader() });
      const data = await res.json();
      if (Array.isArray(data)) {
        const pumpLogs = data.filter(l => l.action.toLowerCase().includes("pompa"));
        setLogs(pumpLogs.slice(0, 8));
      }
    } catch (e) { console.error("History error"); }
  };

  // --- CHART LOGIC (DARK MODE) ---
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
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");

    // CONFIG DARK MODE CHART (Agar terlihat di background gelap)
    Chart.defaults.color = '#ccc';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map(d => new Date(d.created_at).toLocaleTimeString("id-ID")),
        datasets: [
          {
            label: "Suhu (°C)",
            data: data.map(d => d.temperature),
            borderColor: "#f87171",
            backgroundColor: "rgba(248, 113, 113, 0.2)",
            fill: true,
            tension: 0.4
          },
          {
            label: "Kelembapan (%)",
            data: data.map(d => d.humidity),
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.2)",
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        animation: { duration: 0 },
        scales: {
            x: { ticks: { color: '#eee' } },
            y: { ticks: { color: '#eee' } }
        },
        plugins: {
            legend: { labels: { color: '#eee' } }
        }
      }
    });
  };

  // --- CONTROL LOGIC ---
  const handlePumpControl = async (status) => {
    const currentMode = settings?.mode || "otomatis";
    const currentHum = settings?.min_humidity || 80;
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
          min_humidity: parseFloat(currentHum)
        }),
      });

      if (res.ok) {
        alert("✅ Perintah Berhasil Dikirim!");
        setSettings(prev => ({
            ...prev,
            mode: targetMode,
            pump_status: status
        }));
        setTimeout(refreshAll, 500);
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

  const isPumpOn = settings?.pump_status === 1 || settings?.pump_status === true;

  // --- RENDER UI (DARK GLASS THEME) ---
  return (
    <div className="min-vh-100 font-sans text-white"
         style={{ background: "radial-gradient(circle at top left, #1e293b, #0f172a)" }}>
      
      {/* NAVBAR GLASS */}
      <nav className="navbar navbar-expand-lg navbar-dark mb-4 shadow-sm" 
           style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="container">
          <span className="navbar-brand fw-bold text-info"><i className="bi bi-flower1 me-2"></i> Panel Petani</span>
          <div className="d-flex align-items-center">
            <span className="me-3 text-white-50">Halo, <strong className="text-white">{userName}</strong></span>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm rounded-pill px-3">Keluar</button>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="row g-4">
          
          {/* KOLOM KIRI (Sensor & Chart) */}
          <div className="col-md-8">
            {/* CARD SENSOR */}
            <div className="p-4 mb-4 text-center shadow-lg" style={glassStyle}>
              <h5 className="text-start mb-4 text-warning"><i className="bi bi-cpu me-2"></i> Kondisi Kumbung</h5>
              <div className="row">
                <div className="col-6 border-end border-secondary">
                  <p className="mb-0 text-white-50">Suhu</p>
                  <div className="display-4 fw-bold text-danger">{sensorData?.temperature || 0}°C</div>
                </div>
                <div className="col-6">
                  <p className="mb-0 text-white-50">Kelembapan</p>
                  <div className="display-4 fw-bold text-info">{sensorData?.humidity || 0}%</div>
                </div>
              </div>
              <div className="border-top border-secondary pt-3 mt-3 d-flex justify-content-between text-white-50 small">
                <span><i className="bi bi-info-circle"></i> Target Kelembapan: <strong>{settings?.min_humidity || 80}%</strong></span>
                <span className={`badge ${settings?.mode === 'manual' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                    MODE: {(settings?.mode || "otomatis").toUpperCase()}
                </span>
              </div>
            </div>

            {/* CARD CHART */}
            <div className="p-4 mb-4 shadow-lg" style={glassStyle}>
              <h5 className="mb-3 text-white-50"><i className="bi bi-graph-up me-2"></i> Tren Real-Time</h5>
              <div style={{ height: "300px" }}>
                <canvas ref={chartRef}></canvas>
              </div>
            </div>

            {/* CARD HISTORY */}
            <div className="p-4 shadow-lg" style={glassStyle}>
                <h5 className="mb-3 text-white-50"><i className="bi bi-clock-history me-2"></i> Riwayat Pompa</h5>
                <div className="table-responsive">
                    <table className="table table-dark table-hover" style={{ background: 'transparent' }}>
                        <thead>
                            <tr className="text-white-50"><th>Waktu</th><th>Pelaku</th><th>Aksi</th></tr>
                        </thead>
                        <tbody className="border-top border-secondary">
                            {logs.length > 0 ? logs.map((log, i) => (
                                <tr key={i}>
                                    <td className="small text-white-50">{new Date(log.created_at).toLocaleString("id-ID")}</td>
                                    <td><span className="badge bg-secondary">{log.full_name || 'Sistem'}</span></td>
                                    <td className={log.action.includes('Nyala') ? 'text-success fw-bold' : 'text-danger'}>{log.action}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" className="text-center text-white-50">Belum ada riwayat</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>

          {/* KOLOM KANAN (Kontrol Pompa) */}
          <div className="col-md-4">
            <div className="p-4 shadow-lg h-100" style={glassStyle}>
                <h5 className="mb-4 text-center text-success fw-bold">Kontrol Pompa</h5>
                
                <div className="text-center mb-4 p-3 rounded-3" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <p className="mb-2 text-white-50">Status Saat Ini:</p>
                    <h4 className={`fw-bold ${isPumpOn ? 'text-success' : 'text-danger'}`}>
                        {isPumpOn ? "AKTIF (MENYEMPROT)" : "MATI (STANDBY)"}
                    </h4>
                    <div className={`spinner-grow spinner-grow-sm mt-2 ${isPumpOn ? 'text-success' : 'text-danger'}`} role="status"></div>
                </div>

                <div className="d-grid gap-3">
                    {isPumpOn ? (
                        <button onClick={() => handlePumpControl(0)} className="btn btn-danger btn-lg shadow fw-bold py-3" style={{ border: "2px solid rgba(255,255,255,0.2)" }}>
                            <i className="bi bi-power me-2"></i> MATIKAN POMPA
                        </button>
                    ) : (
                        <button onClick={() => handlePumpControl(1)} className="btn btn-success btn-lg shadow fw-bold py-3" style={{ border: "2px solid rgba(255,255,255,0.2)" }}>
                            <i className="bi bi-power me-2"></i> NYALAKAN POMPA
                        </button>
                    )}
                </div>

                <div className="alert alert-warning mt-4 mb-0 small border-0 text-dark" style={{ background: "rgba(255, 193, 7, 0.9)" }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Perhatian:</strong> Mengontrol pompa secara manual akan otomatis menonaktifkan mode IoT (Otomatis).
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserDashboard;