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

  