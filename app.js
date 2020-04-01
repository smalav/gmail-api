const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const indexRouter = require('./src/routes/index');

const app = express();

// cors filter
app.use(cors());
// json parser
app.use(express.json());
// encoding url
app.use(express.urlencoded({ extended: false }));
// cookie parser
app.use(cookieParser());

/* Routing */
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

/* error handler */
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
