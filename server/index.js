var fs = require('fs');
var PeerServer = require('peer').PeerServer;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://heroku_Owner:MongoPW1234@ds053310.mlab.com:53310/sharecode";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});


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
  app = express(),
  app2 = express(),
  httpServer = require("http").createServer(app2);
httpsServer = require("https").createServer(credentials, app);
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