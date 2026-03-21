var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
let mongoose = require('mongoose');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/', indexRouter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/posts', require('./routes/comments'));
app.use('/api/posts', require('./routes/reactions'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));
app.use('/api/upload', require('./routes/uploads'));
app.use('/api/media', require('./routes/media'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/admin', require('./routes/admin'));

// MongoDB connection
mongoose.connect('mongodb+srv://admin:Hoangbinh.059@socialmedia.rzsykzv.mongodb.net/SocialMedia?appName=SocialMedia');
mongoose.connection.on('connected', function () {
  console.log("MongoDB connected");
  // Seed data (roles + admin user)
  let { seedData } = require('./utils/data');
  seedData();
});
mongoose.connection.on('disconnected', function () {
  console.log("MongoDB disconnected");
});
mongoose.connection.on('error', function (err) {
  console.log("MongoDB error:", err.message);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
