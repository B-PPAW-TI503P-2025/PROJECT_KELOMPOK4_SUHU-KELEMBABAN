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
}