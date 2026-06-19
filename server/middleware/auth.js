const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
  try {
    // Get token from header: "Bearer eyJhbGci..." means auth req
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, access denied' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user info to request used in getME
    req.user = decoded  // { id, role }
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'hospital_admin') {
    return res.status(403).json({ message: 'Hospital admins only' })
  }
  next()
}

module.exports = { protect, adminOnly }