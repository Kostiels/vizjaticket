const jwt = require('jsonwebtoken')
const User = require('../models/User')
const passport = require('passport')

exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  req.flash('error_msg', 'Musisz się zalogować')
  res.redirect('/user/login')
}

exports.ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next()
  }
  req.flash('error_msg', 'Brak uprawnień')
  res.redirect('/')
}

exports.authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Brak tokena' })
  }
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, error: 'Nieprawidłowy format tokena' })
  }
  const token = parts[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key')
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Nieprawidłowy token' })
  }
}

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }
  res.status(403).json({ success: false, error: 'Brak uprawnień administratora' })
}
