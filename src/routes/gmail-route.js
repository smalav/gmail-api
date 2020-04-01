const express = require('express');
const router = express.Router();

const gmailService = require('../service/gmail-service'); 

router.get('/recent-ten-email', router.fetchEmail = (req, res, next)=>{
    gmailService.fetchEmail(req, res, next);
})

module.exports = router;
