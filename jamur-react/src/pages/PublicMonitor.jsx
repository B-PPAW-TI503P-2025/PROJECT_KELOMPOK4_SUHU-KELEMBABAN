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