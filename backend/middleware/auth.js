const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware untuk verifikasi JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token diperlukan' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ambil data user dari database untuk memastikan user masih aktif
    const [users] = await pool.execute(
      'SELECT id, username, email, role, full_name, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'User tidak ditemukan atau tidak aktif' 
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token tidak valid atau sudah expired' 
    });
  }
};

// Middleware untuk cek role admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Akses ditolak. Hanya admin yang dapat mengakses fitur ini' 
    });
  }
  next();
};

// Middleware untuk cek role guru
const requireGuru = (req, res, next) => {
  if (req.user.role !== 'guru' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Akses ditolak. Hanya guru atau admin yang dapat mengakses fitur ini' 
    });
  }
  next();
};

// Middleware untuk cek role siswa
const requireSiswa = (req, res, next) => {
  if (req.user.role !== 'siswa' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Akses ditolak. Hanya siswa atau admin yang dapat mengakses fitur ini' 
    });
  }
  next();
};

// Middleware untuk cek role operator
const requireOperator = (req, res, next) => {
  if (req.user.role !== 'operator' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Akses ditolak. Hanya operator atau admin yang dapat mengakses fitur ini' 
    });
  }
  next();
};

// Middleware untuk cek role orang tua
const requireOrangTua = (req, res, next) => {
  if (req.user.role !== 'orang_tua' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Akses ditolak. Hanya orang tua atau admin yang dapat mengakses fitur ini' 
    });
  }
  next();
};

// Middleware untuk cek multiple roles
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Akses ditolak. Hanya ${allowedRoles.join(' atau ')} yang dapat mengakses fitur ini` 
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireGuru,
  requireSiswa,
  requireOperator,
  requireOrangTua,
  requireRole
};