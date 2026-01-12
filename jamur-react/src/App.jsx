import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PublicMonitor from "./pages/PublicMonitor";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Utama (Index.html) */}
        <Route path="/" element={<PublicMonitor />} />
        
        {/* Halaman Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Halaman Admin (Butuh Proteksi nanti) */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Halaman User */}
        <Route path="/user" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;