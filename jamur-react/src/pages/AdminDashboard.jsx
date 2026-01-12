import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Chart from "chart.js/auto";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

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