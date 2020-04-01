const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const base64url = require('base64url');

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = "token.json";

const gmail = {};

gmail.fetchEmail = (req, res, next) => {
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), auth => getMessageList(auth, res));
  });
};

gmail.fetchEmailBody = (req, res, next) => {
  fs.readFile("credentials.json", (err, content) => {
    if (err) return console.log("Error loading client secret file:", err);
    authorize(JSON.parse(content), auth => getMessageBody(auth, req, res));
  });
};

module.exports = gmail;

authorize = (credentials, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
};

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function getMessageBody(auth, req, res) {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.messages.get(
    {
      userId: "me",
      id: req.params.id
    },
    (err, response) => {
      if (err) return console.log("The API returned an error: " + err);

      let message = "no message";
      if (response.data.payload.body.size > 0) {
        message = base64url.decode(response.data.payload.body.data);
      } else if (response.data.payload.parts) {
        message = "";
        response.data.payload.parts.forEach(item => {
          message += base64url.decode(item.body.data);
        });
      }
      res.json(message);
    }
  );
}

function getMessageSummary(auth, id) {
  return new Promise(resolve => {
    const gmail = google.gmail({ version: "v1", auth });
    gmail.users.messages.get(
      {
        userId: "me",
        id: id
      },
      (err, res) => {
        if (err) return console.log("The API returned an error: " + err);

        if (res.data.labelIds.includes("INBOX")) {
          return resolve({ emailId: id, title: res.data.snippet });
        }
        return resolve(null);
      }
    );
  });
}

async function getMessageList(auth, res) {
  const gmail = google.gmail({ version: "v1", auth });
  gmail.users.messages.list(
    {
      userId: "me",
      maxResults: 200
    },
    (err, response) => {
      if (err) return console.log("The API returned an error: " + err);

      const listOfAllMessage = response.data.messages;

      const pArray = listOfAllMessage.map(async item => {
        return await getMessageSummary(auth, item.id);
      });
      Promise.all(pArray).then(values => {
        const removeNonMail = values.filter(item => item !== null);
        const topTenMail = removeNonMail.slice(0, 10);
        res.json(topTenMail);
      });
    }
  );
}
