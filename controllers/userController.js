const User = require('../models/User')
const passport = require('passport')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, password2 } = req.body
    let errors = []
    if (!name || !email || !password || !password2) {
      errors.push({ msg: 'Wypełnij wszystkie pola' })
    }
    if (password !== password2) {
      errors.push({ msg: 'Hasła nie są zgodne' })
    }
    if (password.length < 6) {
      errors.push({ msg: 'Hasło musi mieć co najmniej 6 znaków' })
    }
    if (errors.length > 0) {
      return res.render('user/register', {
        title: 'Rejestracja',
        errors,
        name,
        email
      })
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      errors.push({ msg: 'Taki email już istnieje' })
      return res.render('user/register', { title: 'Rejestracja', errors, name, email })
    }
    const newUser = new User({ name, email, password })
    await newUser.save()
    req.flash('success_msg', 'Rejestracja zakończona. Zaloguj się.')
    res.redirect('/user/login')
  } catch (error) {
    req.flash('error_msg', 'Błąd rejestracji')
    res.redirect('/user/register')
  }
}

exports.loginUser = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      req.flash('error_msg', info.message || 'Nieprawidłowe dane logowania');
      return res.redirect('/user/login');
    }
    req.login(user, (err) => {
      if (err) { return next(err); }
      if (req.body.rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000
      } else {
        req.session.cookie.expires = false
      }
      return res.redirect('/')
    })
  })(req, res, next)
}

exports.logoutUser = (req, res) => {
  req.logout(err => {
    if (err) {
      return res.redirect('/')
    }
    req.flash('success_msg', 'Wylogowano')
    res.redirect('/user/login')
  })
}

exports.getUserProfile = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Musisz się zalogować')
      return res.redirect('/user/login')
    }
    res.render('user/profile', {
      title: 'Profil użytkownika',
      user: req.user
    })
  } catch (error) {
    req.flash('error_msg', 'Błąd wczytywania profilu')
    res.redirect('/')
  }
}

exports.updateUserProfile = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Musisz się zalogować')
      return res.redirect('/user/login')
    }
    const { name, phone, street, city, zipCode, country } = req.body
    const user = await User.findById(req.user._id)
    if (!user) {
      req.flash('error_msg', 'Użytkownik nie istnieje')
      return res.redirect('/user/profile')
    }
    user.name = name
    user.phone = phone
    user.address = {
      street,
      city,
      zipCode,
      country
    }
    await user.save()
    req.flash('success_msg', 'Profil zaktualizowano')
    res.redirect('/user/profile')
  } catch (error) {
    req.flash('error_msg', 'Błąd aktualizacji profilu')
    res.redirect('/user/profile')
  }
}

exports.changePassword = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      req.flash('error_msg', 'Musisz się zalogować')
      return res.redirect('/user/login')
    }
    const { currentPassword, newPassword, newPassword2 } = req.body
    if (!currentPassword || !newPassword || !newPassword2) {
      req.flash('error_msg', 'Wypełnij wszystkie pola przy zmianie hasła')
      return res.redirect('/user/profile#editProfileTab')
    }
    if (newPassword !== newPassword2) {
      req.flash('error_msg', 'Nowe hasła nie są zgodne')
      return res.redirect('/user/profile#editProfileTab')
    }
    if (newPassword.length < 6) {
      req.flash('error_msg', 'Hasło musi mieć co najmniej 6 znaków')
      return res.redirect('/user/profile#editProfileTab')
    }
    const user = await User.findById(req.user._id)
    if (!user) {
      req.flash('error_msg', 'Użytkownik nie istnieje')
      return res.redirect('/user/profile')
    }
    const match = await user.matchPassword(currentPassword)
    if (!match) {
      req.flash('error_msg', 'Bieżące hasło jest nieprawidłowe')
      return res.redirect('/user/profile#editProfileTab')
    }
    user.password = newPassword
    await user.save()
    req.flash('success_msg', 'Hasło zostało zmienione')
    res.redirect('/user/profile')
  } catch (error) {
    req.flash('error_msg', 'Błąd przy zmianie hasła')
    res.redirect('/user/profile')
  }
}

exports.apiRegisterUser = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Brak danych' })
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email zajęty' })
    }
    const newUser = new User({ name, email, password })
    await newUser.save()
    res.status(201).json({ success: true, message: 'Użytkownik zarejestrowany' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd rejestracji' })
  }
}

exports.apiLoginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Brak danych' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, error: 'Nieprawidłowe dane' })
    }
    const match = await user.matchPassword(password)
    if (!match) {
      return res.status(401).json({ success: false, error: 'Nieprawidłowe dane' })
    }
    const token = jwt.sign({ id: user._id, role: user.role }, 'secret_key', { expiresIn: '1h' })
    res.json({ success: true, token, user: user.getProfile() })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd logowania' })
  }
}

exports.apiGetUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono użytkownika' })
    }
    res.json({ success: true, data: user.getProfile() })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd pobierania profilu' })
  }
}

exports.apiUpdateUserProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono użytkownika' })
    }
    if (name) user.name = name
    if (phone) user.phone = phone
    if (address) {
      if (address.street) user.address.street = address.street
      if (address.city) user.address.city = address.city
      if (address.zipCode) user.address.zipCode = address.zipCode
      if (address.country) user.address.country = address.country
    }
    await user.save()
    res.json({ success: true, data: user.getProfile() })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd aktualizacji profilu' })
  }
}

exports.apiChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Brak danych' })
    }
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono użytkownika' })
    }
    const match = await user.matchPassword(currentPassword)
    if (!match) {
      return res.status(401).json({ success: false, error: 'Bieżące hasło jest nieprawidłowe' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Hasło musi mieć co najmniej 6 znaków' })
    }
    user.password = newPassword
    await user.save()
    res.json({ success: true, message: 'Hasło zmienione' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd zmiany hasła' })
  }
}
