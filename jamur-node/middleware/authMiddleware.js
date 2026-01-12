const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ message: "Akses ditolak, token tidak ada" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "KUNCI_RAHASIA_YANG_SAMA",
    (err, decoded) => {
      if (err) return res.status(403).json({ message: "Token tidak valid" });
      req.user = decoded; // Menyimpan data user (id & role) ke dalam request
      next();
    }
  );
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses khusus Admin!" });
  }
  next();
};
