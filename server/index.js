var fs = require('fs');
var PeerServer = require('peer').PeerServer;
let bodyParser = require('body-parser');
var url = "mongodb://127.0.0.1:27017/sharecode";
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(url, { useNewUrlParser: true });

// Certificate
const privateKey = fs.readFileSync(
  "/etc/letsencrypt/live/sharecode.online/privkey.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "/etc/letsencrypt/live/sharecode.online/cert.pem",
  "utf8"
);
const ca = fs.readFileSync(
  "/etc/letsencrypt/live/sharecode.online/chain.pem",
  "utf8"
);

var server = PeerServer({
  debug: true,
  port: 9000,
  ssl: {
    key: privateKey,
    cert: certificate
  }
});

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};
let httpsRedirect = require("express-https-redirect");
let express = require("express"),
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
  app = express(),
  app2 = express(),
  httpServer = require("http").createServer(app2);
httpsServer = require("https").createServer(credentials, app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app2.use(bodyParser.json());
app2.use(bodyParser.urlencoded({
    extended: false
}));

httpsServer.listen(443, function() {
  console.log("CONNECTED https");
});

httpServer.listen(80, function() {
  console.log("CONNECTED http");
});

let io = require("socket.io").listen(httpsServer);
require("./sockets/sockets")(io);
app.use(express.static(__dirname + "/dist"));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "/dist" });
});
app2.get("/", httpsRedirect(true), (req, res) => {
  res.sendFile("index.html", { root: "/dist" });
});