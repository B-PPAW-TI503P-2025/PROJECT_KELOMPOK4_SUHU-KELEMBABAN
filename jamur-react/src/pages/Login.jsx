import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Cek kalau sudah login, langsung lempar ke dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token) {
      navigate(role === "admin" ? "/admin" : "/user");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("username", data.user.username);
        
        navigate(data.user.role === "admin" ? "/admin" : "/user");
      } else {
        setError(data.message || "Gagal Login");
      }
    } catch (err) {
      setError("Server tidak terhubung");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white" style={{ background: "radial-gradient(circle at top left, #1e293b, #0f172a)" }}>
      <div className="card p-4 bg-transparent border border-secondary shadow-lg" style={{ width: "400px", backdropFilter: "blur(10px)" }}>
        <h2 className="text-center mb-4 text-info">Smart Mushroom</h2>
        
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control bg-dark text-white border-secondary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control bg-dark text-white border-secondary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Masuk Sistem</button>
        </form>
      </div>
    </div>
  );
};

export default Login;