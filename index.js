const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const seneca = require('seneca')();
const axios = require('axios');
const PORT = process.env.PORT || 5555;
const app = express();
const { Client } = require('pg');
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(multer());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));

var server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

/*************************************
 * Health Camp SPA                   *
 *************************************/
app.get('/healthCamp', (req, res) => {
  res.render('pages/health_camp_spa');
  dbClient.connect();
});

app.post('/savePersonalInfo', function(req, res) {
  const text = 'INSERT INTO healthrecords(ID, FirstName, LastName, Gender, Age, Details, Photo) VALUES($1, $2, $3, $4, $5, $6, $7)';
  const values = [req.body.id, req.body.fn, req.body.ln, req.body.gn, req.body.ag, req.body.dt, req.body.ph];
  dbClient.query(text, values, (err, res) => {
    if (err) {
      console.log(err);
    }
  });
  res.sendStatus(200);
});

app.post('/saveHealthInfo', function(req, res) {
  const text = 'UPDATE healthrecords SET Height=$1, Weight=$2, BodyTemp=$3, Pulse=$4, BloodPressure=$5, Medications=$6, Notes=$7 WHERE ID=$8';
  const values = [req.body.ht, req.body.wt, req.body.bt, req.body.pr, req.body.bp, req.body.md, req.body.nt, req.body.id];
  dbClient.query(text, values, (err, res) => {
    if (err) {
      console.log(err);
    }
  });
  res.sendStatus(200);
});

app.get('/retrieveInfo', async function(req, res) {
  const { rows } = await dbClient.query("SELECT * FROM healthrecords");
  res.send(JSON.stringify(rows));
});

/*************************************
 * MyCO Google Map                   *
 *************************************/

seneca.add('role:map,cmd:getData', async function (msg, reply) {
  // GET the JSON map data from the provided URL
  const response = await axios.get(msg.url);
  reply(null, response.data)
});

app.get('/mycoMap', (req, res) => {
  res.render('pages/myco_map');
});

app.get('/getMapData', (req, res) => {
  seneca.act({
    role: 'map',
    cmd: 'getData',
    url:'https://raw.githubusercontent.com/mtkwong/cmpe280/master/data.json'
  }, function (err, result) {
    if (err) return console.error(err)
    console.log(JSON.stringify(result));
    res.send(JSON.stringify(result));
  });
});

/*************************************
 * General Practitioner Chatbot      *
 *************************************/

app.get('/gpChat', (req, res) => {
  res.render('pages/gp_chatbot');
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
/*
wss.on('connection', (ws) => {
  //console.log('Client connected');
  //ws.on('close', () => console.log('Client disconnected'));

});*/
/*
setInterval(() => {
  wss.clients.forEach((client) => {
    client.send(new Date().toTimeString());
  });
}, 1000);*/


//var http = require('http');
var url = require('url');
var fs = require('fs');
//var WebSocketServer = require('websocket').server;

var connectionArray = [];
var nextID = Date.now();
var appendToMakeUnique = 1;
/*
var httpServer = http.createServer(function(request, response) {
    console.log((new Date()) + " Received request for " + request.url);
    response.writeHead(404);
    response.end();
});

httpServer.listen(6502, function() {
    console.log((new Date()) + " Server is listening on port 6502");
});

// Create the WebSocket server
var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: true // You should use false here!
});*/

function originIsAllowed(origin) {
  // This is where you put code to ensure the connection should
  // be accepted. Return false if it shouldn't be.
  return true;
}
function isUsernameUnique(name) {
  var isUnique = true;
  var i;
  for (i=0; i<connectionArray.length; i++) {
    if (connectionArray[i].username === name) {
      isUnique = false;
      break;
    }
  }
  return isUnique;
}
function getConnectionForID(id) {
  var connect = null;
  var i;
  for (i=0; i<connectionArray.length; i++) {
    if (connectionArray[i].clientID === id) {
      connect = connectionArray[i];
      break;
    }
  }
  return connect;
}
function makeUserListMessage() {
  var userListMsg = {
    type: "userlist",
    users: []
  };
  var i;
  // Add the users to the list
  for (i=0; i<connectionArray.length; i++) {
    userListMsg.users.push(connectionArray[i].username);
  }
  return userListMsg;
}
function sendUserListToAll() {
  var userListMsg = makeUserListMessage();
  var userListMsgStr = JSON.stringify(userListMsg);
  var i;
  for (i=0; i<connectionArray.length; i++) {
    connectionArray[i].sendUTF(userListMsgStr);
  }
}

//wsServer.on('connect', function(connection) {
wss.on('connection', function(connection) {
//  if (!originIsAllowed(connection.origin)) {
//    request.reject();
//    console.log((new Date()) + "Connection from " + connection.origin + " rejected.");
//    return;
//  }
  
  console.log((new Date()) + " Connection accepted.");
  connectionArray.push(connection);

  // Send the new client its token; it will
  // respond with its login username.

  connection.clientID = nextID;
  nextID++;

  var msg = {
    type: "id",
    id: connection.clientID
  };
  connection.send(JSON.stringify(msg));

  // Handle the "message" event received over WebSocket. This
  // is a message sent by a client, and may be text to share with
  // other users or a command to the server.

  connection.on('message', function(message) {
    console.log(message);
    if (message.type === 'utf8') {
      console.log("Received Message: " + message.utf8Data);

      // Process messages

      var sendToClients = true;
      msg = JSON.parse(message.utf8Data);
      var connect = getConnectionForID(msg.id);

      switch(msg.type) {
        case "message":
          msg.name = connect.username;
          msg.text = msg.text.replace(/(<([^>]+)>)/ig,"");
          break;
        case "username":
          var nameChanged = false;
          var origName = msg.name;

          while (!isUsernameUnique(msg.name)) {
            msg.name = origName + appendToMakeUnique;
            appendToMakeUnique++;
            nameChanged = true;
          }

          if (nameChanged) {
            var changeMsg = {
              id: msg.id,
              type: "rejectusername",
              name: msg.name
            };
            connect.sendUTF(JSON.stringify(changeMsg));
          }

          connect.username = msg.name;
          sendUserListToAll();
          break;
      }

      // Convert the message back to JSON and send it out
      // to all clients.

      if (sendToClients) {
        var msgString = JSON.stringify(msg);
        var i;

        for (i=0; i<connectionArray.length; i++) {
          connectionArray[i].sendUTF(msgString);
        }
      }
    }
  });
  
  // Handle the WebSocket "close" event; this means a user has logged off
  // or has been disconnected.
  
  connection.on('close', function(connection) {
    connectionArray = connectionArray.filter(function(el, idx, ar) {
      return el.connected;
    });
    sendUserListToAll();  // Update the user lists
    console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
  });
});

/*************************************
 * Other functionality               *
 *************************************/

function stop() {
  dbClient.end();
  server.close();
}

module.exports = app;
module.exports.stop = stop;