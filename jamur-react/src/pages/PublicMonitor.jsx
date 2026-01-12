import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PublicMonitor = () => {
  const [data, setData] = useState({ temperature: 0, humidity: 0 });
  const [lastUpdate, setLastUpdate] = useState("-");