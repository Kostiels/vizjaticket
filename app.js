const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const errorHandler = require('./middleware/errorHandler');
const { initPlaceholders } = require('./middleware/imagePlaceholder');
require('dotenv').config();
require('./config/database');
require('./config/passport')(passport);
const seedEvents = require('./utils/initData');

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

if (!process.env.APP_URL) {
  process.env.APP_URL = 'http://localhost:3000';
}

initPlaceholders();

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');
app.use(expressLayouts);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'ticket_reservation_secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  const successArray = req.flash('success_msg');
  const errorArray = req.flash('error_msg');
  const errorGen = req.flash('error');
  res.locals.success_msg = successArray.length > 0 ? successArray[0] : null;
  res.locals.error_msg = errorArray.length > 0 ? errorArray[0] : null;
  res.locals.error = errorGen.length > 0 ? errorGen[0] : null;
  res.locals.user = req.user || null;
  res.locals.scripts = '';
  next();
});

app.use('/', require('./routes/web'));
app.use('/api', require('./routes/api'));
app.use('/admin', require('./routes/admin'));
app.use('/events', require('./routes/events'));

app.use('/admin/events/:id/edit', (req, res, next) => {
  console.log(`Edit event route accessed for ID: ${req.params.id}`);
  next();
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  await seedEvents();
});
