import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminName, setAdminName] = useState("Admin");
  
  // Data States
  const [sensorData, setSensorData] = useState({ temperature: 0, humidity: 0 });
  const [settings, setSettings] = useState({ min_humidity: 80, mode: "otomatis", pump_status: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Form Edit State
  const [editUser, setEditUser] = useState({ id: "", full_name: "", username: "", password: "" });

  // Chart Ref
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Style Glassmorphism
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "15px",
    color: "white"
  };

  const inputGlassStyle = {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "white"
  };

  // 1. CEK TOKEN & LOAD DATA
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "admin") {
      navigate("/login");
    } else {
      setAdminName(localStorage.getItem("username") || "Admin");
      fetchSensorData();
      fetchSettings();
      fetchChartData();
      
      const interval = setInterval(() => {
        if(activeTab === "dashboard") {
          fetchSensorData();
          fetchChartData();
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [navigate, activeTab]);

  // --- API CALLS ---
  const API_URL = "http://localhost:3001/api";
  const getHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

  const fetchSensorData = async () => {
    try {
      const res = await fetch(`${API_URL}/sensor/latest`);
      const data = await res.json();
      setSensorData(data);
    } catch(e) { console.log(e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, { headers: getHeader() });
      const data = await res.json();
      // Pastikan data tidak null sebelum di-set
      if (data) setSettings(data);
    } catch(e) { console.log(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getHeader() });
      const data = await res.json();
      setUsers(data);
    } catch(e) { console.log(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/logs`, { headers: getHeader() });
      const data = await res.json();
      setLogs(data);
    } catch(e) { console.log(e); }
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
    } catch(e) { console.error(e); }
  };

  const updateChart = (data) => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    
    // Config Chart agar tulisan putih (Dark Mode Support)
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
            borderColor: "#f87171", // Merah Terang
            backgroundColor: "rgba(248, 113, 113, 0.2)",
            fill: true,
            tension: 0.4
          },
          {
            label: "Kelembapan (%)",
            data: data.map(d => d.humidity),
            borderColor: "#38bdf8", // Biru Terang
            backgroundColor: "rgba(56, 189, 248, 0.2)",
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: { legend: { labels: { color: 'white' } } },
        scales: {
            x: { ticks: { color: 'white' } },
            y: { ticks: { color: 'white' } }
        }
      }
    });
  };

  // --- ACTIONS ---
  const handleUpdateSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: "PUT",
        headers: { ...getHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({
          min_humidity: parseFloat(settings.min_humidity),
          mode: settings.mode
        }),
      });
      if(res.ok) {
          alert("✅ Konfigurasi Tersimpan!");
          fetchSettings(); // Refresh data settings setelah simpan
      }
    } catch(e) { alert("Gagal Simpan"); }
  };

  const handleDeleteUser = async (id) => {
    if(!confirm("Hapus user ini?")) return;
    await fetch(`${API_URL}/users/${id}`, { method: "DELETE", headers: getHeader() });
    fetchUsers(); 
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData);
    body.role = "petani";

    const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { ...getHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    alert(data.message);
    if(res.ok) e.target.reset();
  };

  const handleEditUser = async () => {
    const body = { full_name: editUser.full_name, username: editUser.username };
    if(editUser.password) body.password = editUser.password;

    await fetch(`${API_URL}/users/${editUser.id}`, {
        method: "PUT",
        headers: { ...getHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    alert("User Updated!");
    fetchUsers();
  };

  const handleLogout = () => {
    if(confirm("Keluar dari sistem?")) {
        localStorage.clear();
        navigate("/login");
    }
  };

  // Main Layout Background
  return (
    <div className="container-fluid min-vh-100 text-white" 
         style={{ background: "radial-gradient(circle at top left, #1e293b, #0f172a)" }}>
      
      <div className="row">
        {/* SIDEBAR GLASS */}
        <div className="col-md-2 p-3 d-flex flex-column min-vh-100" 
             style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(10px)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
            
            <h4 className="text-center mb-4 mt-2 fw-bold" style={{ color: "#38bdf8" }}>
                <i className="bi bi-robot me-2"></i> Admin Panel
            </h4>
            <hr className="border-secondary"/>
            
            <div className="nav flex-column nav-pills gap-2">
                {[
                    { id: 'dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
                    { id: 'add_user', icon: 'bi-person-plus', label: 'Tambah Petani' },
                    { id: 'manage_user', icon: 'bi-people-fill', label: 'Kelola User', action: fetchUsers },
                    { id: 'logs', icon: 'bi-journal-text', label: 'History Log', action: fetchLogs }
                ].map(item => (
                    <button 
                        key={item.id}
                        className={`nav-link text-start text-white border-0 ${activeTab === item.id ? 'active' : ''}`} 
                        style={activeTab === item.id ? { background: "linear-gradient(90deg, #0ea5e9, #2563eb)", boxShadow: "0 4px 12px rgba(14, 165, 233, 0.4)" } : { background: "transparent" }}
                        onClick={() => { setActiveTab(item.id); if(item.action) item.action(); }}>
                        <i className={`bi ${item.icon} me-2`}></i> {item.label}
                    </button>
                ))}
                
                <button className="nav-link text-start text-danger mt-4" onClick={handleLogout} style={{ background: "rgba(220, 53, 69, 0.1)" }}>
                    <i className="bi bi-box-arrow-left me-2"></i> Logout
                </button>
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="col-md-10 p-4">
            
            {/* KONTEN: DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="fade-in">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="fw-bold">Monitor & Konfigurasi</h3>
                        <span className="badge rounded-pill px-3 py-2" style={{ background: "rgba(14, 165, 233, 0.2)", color: "#38bdf8", border: "1px solid rgba(14, 165, 233, 0.5)" }}>
                            <i className="bi bi-shield-lock me-2"></i> Admin: {adminName}
                        </span>
                    </div>

                    {/* Sensor Cards */}
                    <div className="row mb-4 g-4">
                        <div className="col-md-6">
                            <div className="p-4 h-100 d-flex align-items-center" style={{ ...glassStyle, borderLeft: "5px solid #f87171" }}>
                                <i className="bi bi-thermometer-half fs-1 me-3 text-danger"></i>
                                <div>
                                    <h1 className="fw-bold mb-0">{sensorData.temperature}°C</h1>
                                    <small className="text-white-50">Suhu Saat Ini</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="p-4 h-100 d-flex align-items-center" style={{ ...glassStyle, borderLeft: "5px solid #38bdf8" }}>
                                <i className="bi bi-droplet-fill fs-1 me-3 text-info"></i>
                                <div>
                                    <h1 className="fw-bold mb-0">{sensorData.humidity}%</h1>
                                    <small className="text-white-50">Kelembapan Saat Ini</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grafik Glass */}
                    <div className="p-4 mb-4 shadow-lg" style={glassStyle}>
                        <h5 className="mb-3"><i className="bi bi-graph-up me-2"></i> Grafik Real-time</h5>
                        <div style={{ height: "320px" }}>
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>

                    {/* Settings Form Glass */}
                    {/* AREA KONTROL & STATUS (ROW BARU) */}
                    <div className="row g-4">
                        
                        {/* 1. KOLOM KIRI: FORM SETTING */}
                        <div className="col-md-7">
                            <div className="p-4 shadow-lg h-100" style={glassStyle}>
                                <h5 className="mb-4 text-warning"><i className="bi bi-sliders me-2"></i> Kontrol Ambang Batas</h5>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label text-white-50">Batas Kelembapan (%)</label>
                                        <div className="input-group">
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                style={inputGlassStyle}
                                                value={settings.min_humidity} 
                                                onChange={(e) => setSettings({...settings, min_humidity: e.target.value})} 
                                            />
                                            <span className="input-group-text text-white border-0" style={{ background: "rgba(255,255,255,0.1)" }}>%</span>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-white-50">Mode Operasi</label>
                                        <select 
                                            className="form-select" 
                                            style={inputGlassStyle}
                                            value={settings.mode} 
                                            onChange={(e) => setSettings({...settings, mode: e.target.value})}>
                                            <option value="otomatis" className="text-dark">OTOMATIS (IoT)</option>
                                            <option value="manual" className="text-dark">MANUAL (User)</option>
                                        </select>
                                    </div>
                                </div>
                                <button className="btn btn-primary mt-4 w-100 fw-bold py-2" 
                                        style={{ background: "linear-gradient(90deg, #0ea5e9, #2563eb)", border: "none" }}
                                        onClick={handleUpdateSettings}>
                                    <i className="bi bi-save me-2"></i> Simpan Perubahan
                                </button>
                            </div>
                        </div>

                        {/* 2. KOLOM KANAN: PANEL STATUS PERANGKAT (BARU) */}
                        <div className="col-md-5">
                            <div className="p-4 shadow-lg h-100" style={glassStyle}>
                                <h5 className="mb-4 text-info"><i className="bi bi-broadcast me-2"></i> Status Perangkat</h5>
                                
                                <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
                                    <span className="text-white-50">Mode Aktif</span>
                                    <span className={`badge rounded-pill px-3 py-2 ${settings.mode === 'otomatis' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                                        {settings.mode.toUpperCase()}
                                    </span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
                                    <span className="text-white-50">Ambang Batas</span>
                                    <span className="fw-bold fs-5 text-info">{settings.min_humidity}%</span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3">
                                    <span className="text-white-50">Kondisi Pompa</span>
                                    <span className={`fw-bold ${settings.pump_status ? 'text-success' : 'text-danger'}`}>
                                        {settings.pump_status ? (
                                            <span><i className="bi bi-check-circle-fill me-1"></i> NYALA (ON)</span>
                                        ) : (
                                            <span><i className="bi bi-x-circle-fill me-1"></i> MATI (STANDBY)</span>
                                        )}
                                    </span>
                                </div>

                                <div className="d-flex justify-content-between align-items-center pt-2">
                                    <span className="text-white-50">Sinkronisasi</span>
                                    <small className="text-white-50" style={{ fontSize: "0.8rem" }}>
                                        {settings.updated_at ? new Date(settings.updated_at).toLocaleString('id-ID') : '-'}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* KONTEN: TAMBAH USER */}
            {activeTab === 'add_user' && (
                <div className="p-5 mx-auto shadow-lg" style={{ ...glassStyle, maxWidth: "600px" }}>
                    <h3 className="text-success mb-4 text-center"><i className="bi bi-person-plus-fill me-2"></i> Daftarkan Petani</h3>
                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            <label className="text-white-50">Nama Lengkap</label>
                            <input name="full_name" type="text" className="form-control" style={inputGlassStyle} required />
                        </div>
                        <div className="mb-3">
                            <label className="text-white-50">Username</label>
                            <input name="username" type="text" className="form-control" style={inputGlassStyle} required />
                        </div>
                        <div className="mb-3">
                            <label className="text-white-50">Password</label>
                            <input name="password" type="password" className="form-control" style={inputGlassStyle} required minLength="6" />
                        </div>
                        <button type="submit" className="btn btn-success w-100 py-2 mt-3 fw-bold">Simpan Akun</button>
                    </form>
                </div>
            )}

            {/* KONTEN: KELOLA USER */}
            {activeTab === 'manage_user' && (
                <div className="p-4 shadow-lg" style={glassStyle}>
                    <h3 className="mb-4">Manajemen Akun</h3>
                    <div className="table-responsive">
                        <table className="table table-dark table-hover align-middle" style={{ background: "transparent" }}>
                            <thead>
                                <tr className="text-white-50">
                                    <th>Nama</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                        <td>{u.full_name}</td>
                                        <td>{u.username}</td>
                                        <td><span className={`badge rounded-pill ${u.role === 'admin' ? 'bg-danger' : 'bg-success'}`}>{u.role}</span></td>
                                        <td>
                                            <button className="btn btn-sm btn-outline-warning me-2" 
                                                data-bs-toggle="modal" data-bs-target="#editModal"
                                                onClick={() => setEditUser({ ...u, password: '' })}>
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteUser(u.id)}>
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* KONTEN: LOGS */}
            {activeTab === 'logs' && (
                <div className="p-4 shadow-lg" style={glassStyle}>
                    <div className="d-flex justify-content-between mb-4">
                        <h3>Log Aktivitas</h3>
                        <button className="btn btn-sm btn-outline-light" onClick={fetchLogs}><i className="bi bi-arrow-clockwise"></i> Refresh</button>
                    </div>
                    <table className="table table-dark table-striped">
                        <thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th></tr></thead>
                        <tbody>
                            {logs.map((l, i) => (
                                <tr key={i}>
                                    <td className="text-white-50">{new Date(l.created_at).toLocaleString('id-ID')}</td>
                                    <td><span className="badge bg-secondary">{l.full_name || 'SISTEM'}</span></td>
                                    <td>{l.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* MODAL EDIT USER (Tetap pakai Bootstrap Modal tapi disesuaikan dikit warnanya) */}
      <div className="modal fade" id="editModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
            <div className="modal-content bg-dark text-white border-secondary">
                <div className="modal-header border-secondary">
                    <h5 className="modal-title">Edit User</h5>
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div className="modal-body">
                    <label className="text-white-50">Nama Lengkap</label>
                    <input type="text" className="form-control bg-secondary text-white border-0 mb-3" value={editUser.full_name} 
                        onChange={(e) => setEditUser({...editUser, full_name: e.target.value})} />
                    
                    <label className="text-white-50">Username</label>
                    <input type="text" className="form-control bg-secondary text-white border-0 mb-3" value={editUser.username} 
                        onChange={(e) => setEditUser({...editUser, username: e.target.value})} />
                    
                    <label className="text-white-50">Password Baru (Kosongkan jika tetap)</label>
                    <input type="password" className="form-control bg-secondary text-white border-0" value={editUser.password} 
                        onChange={(e) => setEditUser({...editUser, password: e.target.value})} />
                </div>
                <div className="modal-footer border-secondary">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                    <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleEditUser}>Simpan</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;