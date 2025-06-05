const Reservation = require('../models/Reservation');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const crypto = require('crypto');
const axios = require('axios');

function parseDateString(dateString) {
  if (!dateString) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }

  const parts = dateString.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  return null;
}

exports.getPaymentPage = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error_msg', 'Musisz się zalogować');
      return res.redirect('/user/login');
    }

    const reservation = await Reservation.findById(req.params.id)
      .populate('event')
      .populate('tickets');

    if (!reservation) {
      req.flash('error_msg', 'Rezerwacja nie istnieje');
      return res.redirect('/reservations');
    }

    if (reservation.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Brak uprawnień');
      return res.redirect('/reservations');
    }

    if (reservation.status === 'temporary' && reservation.paymentStatus === 'pending') {
      const exp = new Date();
      exp.setMinutes(exp.getMinutes() + 15);
      reservation.expiresAt = exp;
      await reservation.save();
    }

    const templateData = {
      title: 'Płatność za rezerwację',
      reservation,
      exchangeRateInfo: null
    };

    res.render('reservations/payment', templateData);
  } catch (error) {
    req.flash('error_msg', 'Błąd przy wczytywaniu strony płatności');
    res.redirect('/reservations');
  }
};

exports.simplePayment = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const reservationId = req.params.reservationId;
    const reservation = await Reservation.findById(reservationId)
      .populate('event')
      .populate('tickets');

    if (!reservation) {
      return res.status(404).json({ error: 'Rezerwacja nie istnieje' });
    }

    if (reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Brak dostępu' });
    }

    if (reservation.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'Rezerwacja jest już opłacona' });
    }

    reservation.paymentStatus = 'paid';
    reservation.status = 'confirmed';
    reservation.paymentDate = new Date();
    reservation.paymentMethod = req.body.paymentMethod || 'credit_card';

    const paymentId = `payment_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    reservation.paymentId = paymentId;

    await reservation.save();

    await Ticket.updateMany(
      { _id: { $in: reservation.tickets } },
      { status: 'sold' }
    );

    res.json({
      success: true,
      paymentId: paymentId,
      redirectUri: `/payment/success?reservation_id=${reservationId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPaymentSuccessPage = async (req, res) => {
  try {
    const reservationId = req.query.reservation_id;
    let reservation = null;

    if (reservationId) {
      reservation = await Reservation.findById(reservationId)
        .populate('event')
        .populate('tickets');
    }

    res.render('payments/success', {
      title: 'Płatność zakończona sukcesem',
      reservation
    });
  } catch (error) {
    res.redirect('/reservations');
  }
};

exports.getPaymentCancelPage = async (req, res) => {
  try {
    const reservationId = req.query.reservation_id;
    let reservation = null;

    if (reservationId) {
      reservation = await Reservation.findById(reservationId)
        .populate('event');
    }

    res.render('payments/cancel', {
      title: 'Płatność anulowana',
      reservation
    });
  } catch (error) {
    res.redirect('/reservations');
  }
};
