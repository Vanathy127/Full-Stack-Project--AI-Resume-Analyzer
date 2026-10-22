const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please sign in first.' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
};