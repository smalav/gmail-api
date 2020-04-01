const gmail = require('./gmail');

const gmailService = {};

gmailService.fetchEmail = (req, res, next)=>{
    gmail.fetchEmail(req, res, next)
}

module.exports = gmailService;
