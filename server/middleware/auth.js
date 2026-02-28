const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'navigation-dev-secret-change-in-production';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权，请先登录' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token 已过期，请重新登录' });
    }
    return res.status(401).json({ success: false, message: '无效的 Token' });
  }
}

// 可选认证：有 token 则验证，无 token/验证失败则继续（req.admin 为 null）
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.admin = null;
    return next();
  }
  const token = authHeader.slice(7);
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
  } catch {
    req.admin = null;
  }
  next();
}

module.exports = { authMiddleware, optionalAuthMiddleware, JWT_SECRET };
