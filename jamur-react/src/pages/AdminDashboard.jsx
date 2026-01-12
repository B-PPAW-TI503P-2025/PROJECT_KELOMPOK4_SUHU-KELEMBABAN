import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Penting untuk Modal

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard"); // State untuk pindah tab
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

  // 1. CEK TOKEN & LOAD DATA AWAL
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
      
      // Auto refresh data sensor & chart setiap 3 detik
      const interval = setInterval(() => {
        if(activeTab === "dashboard") {
          fetchSensorData();
          fetchSettings();
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
      setSettings(data);
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
    
    // Hapus chart lama jika ada
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
            borderColor: "#dc3545",
            backgroundColor: "rgba(220, 53, 69, 0.1)",
            fill: true,
            tension: 0.3
          },
          {
            label: "Kelembapan (%)",
            data: data.map(d => d.humidity),
            borderColor: "#0d6efd",
            backgroundColor: "rgba(13, 110, 253, 0.1)",
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, animation: { duration: 0 } }
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
      if(res.ok) alert("✅ Konfigurasi Tersimpan!");
    } catch(e) { alert("Gagal Simpan"); }
  };

  const handleDeleteUser = async (id) => {
    if(!confirm("Hapus user ini?")) return;
    await fetch(`${API_URL}/users/${id}`, { method: "DELETE", headers: getHeader() });
    fetchUsers(); // Refresh table
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

  return (
    <div className="container-fluid">
      <div className="row">
        {/* SIDEBAR */}
        <div className="col-md-2 bg-dark text-white min-vh-100 p-3">
            <h4 className="text-center text-info mb-4"><i className="bi bi-patch-check"></i> Admin Panel</h4>
            <div className="nav flex-column nav-pills">
                <button className={`nav-link text-start text-white mb-2 ${activeTab === 'dashboard' ? 'active bg-primary' : ''}`} onClick={() => setActiveTab('dashboard')}>
                    <i className="bi bi-speedometer2 me-2"></i> Dashboard
                </button>
                <button className={`nav-link text-start text-white mb-2 ${activeTab === 'add_user' ? 'active bg-primary' : ''}`} onClick={() => setActiveTab('add_user')}>
                    <i className="bi bi-person-plus me-2"></i> Tambah Petani
                </button>
                <button className={`nav-link text-start text-white mb-2 ${activeTab === 'manage_user' ? 'active bg-primary' : ''}`} onClick={() => { setActiveTab('manage_user'); fetchUsers(); }}>
                    <i className="bi bi-people-fill me-2"></i> Kelola User
                </button>
                <button className={`nav-link text-start text-white mb-2 ${activeTab === 'logs' ? 'active bg-primary' : ''}`} onClick={() => { setActiveTab('logs'); fetchLogs(); }}>
                    <i className="bi bi-journal-text me-2"></i> History Log
                </button>
                <hr className="text-secondary"/>
                <button className="nav-link text-start text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-left me-2"></i> Logout
                </button>
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="col-md-10 p-4 bg-light">
            
            {/* KONTEN: DASHBOARD */}
            {activeTab === 'dashboard' && (
                <div className="fade-in">
                    <div className="d-flex justify-content-between mb-4">
                        <h3>Monitor & Konfigurasi</h3>
                        <span className="badge bg-primary fs-6 p-2 rounded-pill">Admin: {adminName}</span>
                    </div>

                    {/* Sensor Cards */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card p-3 border-start border-danger border-5 shadow-sm">
                                <h2 className="text-danger fw-bold">{sensorData.temperature}°C</h2>
                                <span className="text-muted">Suhu Saat Ini</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card p-3 border-start border-primary border-5 shadow-sm">
                                <h2 className="text-primary fw-bold">{sensorData.humidity}%</h2>
                                <span className="text-muted">Kelembapan Saat Ini</span>
                            </div>
                        </div>
                    </div>

                    {/* Grafik */}
                    <div className="card p-4 shadow-sm mb-4">
                        <h5>Grafik Tren Sensor</h5>
                        <div style={{ height: "300px" }}>
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>

                    {/* Settings Form */}
                    <div className="card p-4 shadow-sm">
                        <h5>Kontrol Ambang Batas</h5>
                        <div className="row mt-3">
                            <div className="col-md-6">
                                <label>Batas Kelembapan (%)</label>
                                <input type="number" className="form-control" 
                                    value={settings.min_humidity} 
                                    onChange={(e) => setSettings({...settings, min_humidity: e.target.value})} 
                                />
                            </div>
                            <div className="col-md-6">
                                <label>Mode Operasi</label>
                                <select className="form-select" 
                                    value={settings.mode} 
                                    onChange={(e) => setSettings({...settings, mode: e.target.value})}>
                                    <option value="otomatis">OTOMATIS (IoT)</option>
                                    <option value="manual">MANUAL (User)</option>
                                </select>
                            </div>
                        </div>
                        <button className="btn btn-primary mt-3" onClick={handleUpdateSettings}>Simpan Perubahan</button>
                    </div>
                </div>
            )}

            {/* KONTEN: TAMBAH USER */}
            {activeTab === 'add_user' && (
                <div className="card p-4 shadow-sm" style={{maxWidth: "600px"}}>
                    <h3 className="text-success mb-3">Daftarkan Petani</h3>
                    <form onSubmit={handleRegister}>
                        <div className="mb-3">
                            <label>Nama Lengkap</label>
                            <input name="full_name" type="text" className="form-control" required />
                        </div>
                        <div className="mb-3">
                            <label>Username</label>
                            <input name="username" type="text" className="form-control" required />
                        </div>
                        <div className="mb-3">
                            <label>Password</label>
                            <input name="password" type="password" className="form-control" required minLength="6" />
                        </div>
                        <button type="submit" className="btn btn-success w-100">Simpan Akun</button>
                    </form>
                </div>
            )}

            {/* KONTEN: KELOLA USER */}
            {activeTab === 'manage_user' && (
                <div className="card p-4 shadow-sm">
                    <h3>Manajemen Akun</h3>
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>Nama</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.full_name}</td>
                                        <td>{u.username}</td>
                                        <td><span className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-success'}`}>{u.role}</span></td>
                                        <td>
                                            <button className="btn btn-sm btn-warning me-2" 
                                                data-bs-toggle="modal" data-bs-target="#editModal"
                                                onClick={() => setEditUser({ ...u, password: '' })}>
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(u.id)}>
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
                <div className="card p-4 shadow-sm">
                    <div className="d-flex justify-content-between mb-3">
                        <h3>Log Aktivitas</h3>
                        <button className="btn btn-sm btn-outline-secondary" onClick={fetchLogs}>Refresh</button>
                    </div>
                    <table className="table table-striped">
                        <thead><tr><th>Waktu</th><th>Pelaku</th><th>Aksi</th></tr></thead>
                        <tbody>
                            {logs.map((l, i) => (
                                <tr key={i}>
                                    <td>{new Date(l.created_at).toLocaleString('id-ID')}</td>
                                    <td>{l.full_name || 'SISTEM'}</td>
                                    <td>{l.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* MODAL EDIT USER (Bootstrap Native) */}
      <div className="modal fade" id="editModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title">Edit User</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div className="modal-body">
                    <label>Nama Lengkap</label>
                    <input type="text" className="form-control mb-2" value={editUser.full_name} 
                        onChange={(e) => setEditUser({...editUser, full_name: e.target.value})} />
                    
                    <label>Username</label>
                    <input type="text" className="form-control mb-2" value={editUser.username} 
                        onChange={(e) => setEditUser({...editUser, username: e.target.value})} />
                    
                    <label>Password Baru (Kosongkan jika tetap)</label>
                    <input type="password" className="form-control" value={editUser.password} 
                        onChange={(e) => setEditUser({...editUser, password: e.target.value})} />
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary" data-bs-dismiss="modal" onClick={handleEditUser}>Simpan</button>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;