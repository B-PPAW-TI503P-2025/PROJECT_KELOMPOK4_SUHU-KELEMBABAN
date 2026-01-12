import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PublicMonitor = () => {
  const [data, setData] = useState({ temperature: 0, humidity: 0 });
  const [lastUpdate, setLastUpdate] = useState("-");

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/sensor/latest");
      const jsonData = await res.json();
      setData(jsonData);
      setLastUpdate(new Date().toLocaleTimeString("id-ID"));
    } catch (err) {
      console.error("Gagal ambil data");
    }
  };

  // Mirip dengan window.onload + setInterval
  useEffect(() => {
    fetchData(); // Jalankan sekali di awal
    const interval = setInterval(fetchData, 3000); // Ulangi tiap 3 detik
    return () => clearInterval(interval); // Bersihkan saat pindah halaman (PENTING di React)
  }, []);

  return (
    <div className="min-vh-100 bg-dark text-white p-4">
      <nav className="navbar navbar-dark bg-transparent border-bottom border-secondary mb-5">
        <div className="container">
          <span className="navbar-brand fw-bold text-info">
            <i className="bi bi-flower1 me-2"></i> Mushroom Monitor
          </span>
          <Link to="/login" className="btn btn-outline-light btn-sm">Login System</Link>
        </div>
      </nav>

      <div className="container">
        <h2 className="text-center mb-5">Kondisi Kumbung Real-time</h2>
        
        <div className="row g-4">
          {/* KARTU SUHU */}
          <div className="col-md-6">
            <div className="card bg-dark border border-secondary p-4 shadow">
              <div className="d-flex justify-content-between mb-3">
                <i className="bi bi-thermometer-half fs-1 text-danger"></i>
                <span className="small text-muted">Update: {lastUpdate}</span>
              </div>
              <h5 className="text-secondary">Suhu Udara</h5>
              <h1 className="display-3 fw-bold">{data.temperature}°C</h1>
              <div className="progress mt-3" style={{ height: "10px" }}>
                <div className="progress-bar bg-danger" style={{ width: `${(data.temperature / 50) * 100}%` }}></div>
              </div>
            </div>
          </div>

          {/* KARTU KELEMBAPAN */}
          <div className="col-md-6">
            <div className="card bg-dark border border-secondary p-4 shadow">
              <div className="d-flex justify-content-between mb-3">
                <i className="bi bi-droplet-fill fs-1 text-primary"></i>
                <span className="small text-muted">Update: {lastUpdate}</span>
              </div>
              <h5 className="text-secondary">Kelembapan</h5>
              <h1 className="display-3 fw-bold">{data.humidity}%</h1>
              <div className="progress mt-3" style={{ height: "10px" }}>
                <div className="progress-bar bg-primary" style={{ width: `${data.humidity}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicMonitor;