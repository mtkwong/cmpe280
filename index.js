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
const WebSocket = require('ws');
const url = require('url');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));

var server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const wss = new WebSocket.Server({ server });

/*************************************
 * Health Camp SPA                   *
 *************************************/
dbClient.connect();
app.get('/healthCamp', (req, res) => {
  res.render('pages/health_camp_spa');
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

var gpChatVersion;

app.get('/gpChat', (req, res) => {
  res.render('pages/gp_chatbot');
  gpChatVersion = 1;
});

app.get('/gpChat2', (req, res) => {
  res.render('pages/gp_chatbot');
  gpChatVersion = 2;
});

var connectionArray = [];
var nextID = Date.now();
var appendToMakeUnique = 1;

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
  var cl = connectionArray.length;
  if(cl > 0) {
    connectionArray[cl-1].send(userListMsgStr);
  }
}
function gpFixedResponse(q) {
  var defaultRes = "I'm sorry, I don't know the answer to that. Have you tried Google?";
  var res = {
    "is bronchitis contagious?": "For the most part, bacterial bronchitis is not contagious.",
    "is pneumonia contagious?": "Yes; however, it stops being contagious when coughing stops.",
    "how much water should i drink?": "Take your weight (in pounds) and divide it in half, to get the number of ounces of water you should drink daily.",
    "how many calories should i eat?": "What's more important than calories is that you eat well-balanced meals and exercise portion control.",
    "what is lupus?": "Lupus, short for systemic lupus erythematosus, is a chronic autoimmune disease that can affect the skin, kidneys, joints, heart, nervous system, and blood cells.",
    "what is gluten?": "Gluten is a protein found in wheat, barley, and rye.",
    "how long does the flu last?": "The typical flu lasts seven to ten days. Drink plenty of fluids, wash your hands frequently, and eat vitamin D-fortified foods like orange juice and yogurt.",
    "can i drink tap water?": "Yes - unless you're on a private well, tap water comes from municipal treatment plants that are carefully monitored and better regulated than bottled water.",
    "is my microwave giving me cancer?": "No. Microwaving doesn't alter food in any way that could make you sick.",
    "do i have asthma?": "You might have asthma if you experience frequent coughing, trouble breathing, or recurring bronchitis.",
    "are vaccines safe?": "Yes.",
    "do i have diabetes?": "Warning signs for diabetes are: extreme thirst, dry mouth, frequent urination, hunger, fatigue, and blurred vision.",
    "do i have the flu?": "Flu symptoms are: muscle pain, cough, chills, fatigue, fever, congestion, and runny nose.",
    "do i have bronchitis?": "Bronchitis symptoms are: chronic or dry cough with phlegm, fatigue, and runny nose.",
    "do i have pneumonia?": "Pneumonia symptoms are: sharp chest pain, fever, chills, dehydration, fatigue, loss of appetite, and shortness of breath.",
  };
  return res[q] || defaultRes;
}
function gpRuleResponse(q) {
  var ret;
  var defaultRes = "I'm sorry, I don't know the answer to that. Have you tried Google?";
  if (q.indexOf("headache") > -1) { ret = "Have you taken a midterm exam recently?"; }
  else if (q.indexOf("feeling drowsy") > -1) { ret = "Do you have flu symptoms, like cold & fever?"; }
  else if (q.indexOf("not exercising") > -1) { ret = "Do you want me to setup a general checkup?"; }
  else if (q.indexOf("stressed") > -1) { ret = "Are you taking any summer internships?"; }
  else if (q.indexOf("lonely") > -1) { ret = "Are you a techie?"; }
  else if (q.indexOf("tired") > -1) { ret = "Are you getting enough sleep?"; }
  else if (q.indexOf("fatigue") > -1) { ret = "Hmm... you might have a cold or the flu."; }
  else if (q.indexOf("yes") > -1) { ret = "Okay. I hope you feel better soon."; }
  else if (q.indexOf("no") > -1) { ret = "Okay. What are your symptoms?"; }
  else { ret = defaultRes; }
  return ret;
}

wss.on('connection', function(connection) {
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
    console.log("Received Message: " + message);

    // Process messages
    var sendToClients = true;
    msg = JSON.parse(message);
    var connect = getConnectionForID(msg.id);

    switch(msg.type) {
      case "message":
        msg.name = connect.username;
        msg.text = msg.text.replace(/(<([^>]+)>)/ig,"");
        var msg2txt;
        if(gpChatVersion == 1) {
          msg2txt = gpFixedResponse(msg.text.toLowerCase());
        } else if(gpChatVersion == 2) {
          msg2txt = gpRuleResponse(msg.text.toLowerCase());
        }
        var msg2 = {
          date: msg.date,
          id: msg.id,
          name: "GP Chatbot",
          text: msg2txt,
          type: msg.type,
          color: "#000000"
        };

        // Convert the message back to JSON and send it to the most recent client.
        if (sendToClients) {
          var msgString = JSON.stringify(msg);
          var msgString2 = JSON.stringify(msg2);
          connectionArray[connectionArray.length-1].send(msgString);
          connectionArray[connectionArray.length-1].send(msgString2);
        }

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
            name: msg.name,
            color: msg.color
          };
          connect.send(JSON.stringify(changeMsg));
        }

        connect.username = msg.name;
        sendUserListToAll();

        // Convert the message back to JSON and send it to the most recent client.
        if (sendToClients) {
          var msgString = JSON.stringify(msg);
          connectionArray[connectionArray.length-1].send(msgString);
        }

        break;
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
 * Build Your Own Pizza              *
 *************************************/

app.get('/pizza', (req, res) => {
  res.render('pages/pizza');
});

/*************************************
 * Redis Image Cache                 *
 *************************************/
const redisClient = require('redis').createClient(process.env.REDIS_URL);
app.get('/cache', (req, res) => {
  redisClient.del("1", function(err, reply) {});
  redisClient.del("2", function(err, reply) {});
  redisClient.del("3", function(err, reply) {});
  res.render('pages/cache');
  /*
  for(var i=1;i<4;i++) {
    redisClient.exists(i.toString(), function(err, reply) {
      if (reply === 1) {
        redisClient.del(i.toString(), function(err, reply) {});
      }
    });
  }*/
});

app.get('/getImage', (req, res) => {
  result = {};
  var id = parseInt(req.query.id).toString();
  //console.log(id);
  redisClient.exists(id, async function(err, reply) {
    if (reply === 1) {
      result["txt"] = "Image loaded from: Redis Cache";
      redisClient.get(id, function(err, reply2) {
        //console.log(reply2);
        result["img"] = reply2;
      });
      //console.log(result);
      res.send(JSON.stringify(result));
    } else {
      result["txt"] = "Image loaded from: PostgreSQL Database";
      const { rows } = await dbClient.query("SELECT * FROM cachetest WHERE ID=" + id);
      var img = rows[0].photo;
      redisClient.set([id, img]);
      result["img"] = img;
      console.log(result);
      res.send(JSON.stringify(result));
    }
  });
});

/*
redisClient.on('connect', function() {
  console.log('connected to redis cache');
});*/

/*************************************
 * Other functionality               *
 *************************************/

function stop() {
  dbClient.end();
  server.close();
}

module.exports = app;
module.exports.stop = stop;