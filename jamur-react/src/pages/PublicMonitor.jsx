import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PublicMonitor = () => {
  // State dengan nilai default aman
  const [data, setData] = useState({ temperature: 0, humidity: 0 });
  const [lastUpdate, setLastUpdate] = useState("-");

  // Fetch Data dengan Safety Check
  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/sensor/latest");
      const jsonData = await res.json();
      
      // Hanya update jika data valid
      if (jsonData) {
        setData(jsonData);
        setLastUpdate(new Date().toLocaleTimeString("id-ID"));
      }
    } catch (err) {
      console.error("Menunggu data sensor...");
    }
  };

  useEffect(() => {
    fetchData(); 
    const interval = setInterval(fetchData, 3000); 
    return () => clearInterval(interval); 
  }, []);

  // Style Glassmorphism (Konsisten dengan Dashboard lain)
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "20px",
    color: "white",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
  };

  return (
    <div className="min-vh-100 font-sans text-white d-flex flex-column"
         style={{ background: "radial-gradient(circle at top center, #1e293b, #0f172a)" }}>
      
      {/* NAVBAR GLASS */}
      <nav className="navbar navbar-dark py-3 mb-5" 
           style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}>
        <div className="container">
          <span className="navbar-brand fw-bold fs-4 text-info d-flex align-items-center">
            <i className="bi bi-flower1 me-2 fs-3"></i> 
            <span>Smart Mushroom <small className="text-white-50 fs-6 ms-2">| Public Monitor</small></span>
          </span>
          <Link to="/login" className="btn btn-outline-light rounded-pill px-4 btn-sm fw-bold">
            <i className="bi bi-box-arrow-in-right me-2"></i> Login Staff
          </Link>
        </div>
      </nav>

      <div className="container flex-grow-1 d-flex flex-column justify-content-center pb-5">
        
        <div className="text-center mb-5">
            <h1 className="fw-bold display-5 mb-2">Pantauan Real-Time</h1>
            <p className="text-white-50">Data kondisi kumbung diperbarui setiap 3 detik secara otomatis.</p>
            <span className="badge bg-dark border border-secondary px-3 py-2 rounded-pill mt-2">
                <i className="bi bi-clock-history me-2 text-warning"></i> 
                Update Terakhir: {lastUpdate}
            </span>
        </div>
        
        <div className="row g-5 justify-content-center">
          {/* KARTU SUHU */}
          <div className="col-md-5 col-lg-4">
            <div className="p-5 h-100 position-relative overflow-hidden text-center" style={glassStyle}>
              {/* Dekorasi Background Icon */}
              <i className="bi bi-thermometer-half position-absolute" 
                 style={{ fontSize: "10rem", right: "-20px", bottom: "-20px", color: "rgba(248, 113, 113, 0.1)", transform: "rotate(-15deg)" }}></i>
              
              <div className="position-relative z-1">
                  <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 p-3 rounded-circle mb-4" 
                       style={{ width: "80px", height: "80px" }}>
                    <i className="bi bi-thermometer-high fs-1 text-danger"></i>
                  </div>
                  <h5 className="text-white-50 mb-1">Suhu Udara</h5>
                  <h1 className="display-2 fw-bold mb-3">{data?.temperature || 0}°C</h1>
                  
                  <div className="progress bg-dark bg-opacity-50" style={{ height: "12px", borderRadius: "10px" }}>
                    <div className="progress-bar bg-danger progress-bar-striped progress-bar-animated" 
                         style={{ width: `${(data?.temperature / 50) * 100}%` }}></div>
                  </div>
                  <small className="text-white-50 mt-2 d-block">Ideal: 26°C - 30°C</small>
              </div>
            </div>
          </div>

          {/* KARTU KELEMBAPAN */}
          <div className="col-md-5 col-lg-4">
            <div className="p-5 h-100 position-relative overflow-hidden text-center" style={glassStyle}>
              {/* Dekorasi Background Icon */}
              <i className="bi bi-droplet-fill position-absolute" 
                 style={{ fontSize: "10rem", right: "-20px", bottom: "-30px", color: "rgba(56, 189, 248, 0.1)", transform: "rotate(15deg)" }}></i>
              
              <div className="position-relative z-1">
                  <div className="d-inline-flex align-items-center justify-content-center bg-info bg-opacity-10 p-3 rounded-circle mb-4" 
                       style={{ width: "80px", height: "80px" }}>
                    <i className="bi bi-moisture fs-1 text-info"></i>
                  </div>
                  <h5 className="text-white-50 mb-1">Kelembapan</h5>
                  <h1 className="display-2 fw-bold mb-3">{data?.humidity || 0}%</h1>
                  
                  <div className="progress bg-dark bg-opacity-50" style={{ height: "12px", borderRadius: "10px" }}>
                    <div className="progress-bar bg-info progress-bar-striped progress-bar-animated" 
                         style={{ width: `${data?.humidity || 0}%` }}></div>
                  </div>
                  <small className="text-white-50 mt-2 d-block">Target Min: 80%</small>
              </div>
            </div>
          </div>
        </div>

      </div>

      <footer className="text-center py-4 text-white-50 border-top border-secondary border-opacity-25" style={{ background: "rgba(0,0,0,0.2)" }}>
        <small>© 2026 Kelompok 4 - Sistem Monitoring Kumbung Jamur Pintar</small>
      </footer>
    </div>
  );
};

export default PublicMonitor;