const jwt = require('jsonwebtoken');

module.exports = function(JWT_SECRET, store) {
  function authenticate(req, res, next) {
    if (req.path.startsWith('/auth/')) {
      return next();
    }
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = store.users.find(u => u.id === payload.userId);
      if (!user) return res.status(401).json({ message: 'Invalid token user' });
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  return { authenticate };
};