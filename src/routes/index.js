const express = require('express');
const router = express.Router();

router.use('/', require('./gmail-route'));

router.get('/', function(req, res, next) {
  res.end('Running ServerApi Succesfully');
});


module.exports = router;
