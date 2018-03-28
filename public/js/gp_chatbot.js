var connection = null;
var clientID = 0;
var WebSocket = WebSocket || MozWebSocket;
var idColors = {};
var g = 0.618033988749895;
var h = Math.random();

function setUsername() {
  var clr = getRandomColor();
  idColors[clientID] = clr;
  var msg = {
    name: document.getElementById("name").value,
    date: Date.now(),
    id: clientID,
    type: "username",
    color: clr
  };
  connection.send(JSON.stringify(msg));
}

function connect() {
  var serverUrl = location.origin.replace(/^http/, 'ws');

  connection = new WebSocket(serverUrl);

  connection.onopen = function(evt) {
    document.getElementById("text").disabled = false;
    document.getElementById("send").disabled = false;
  };

  connection.onmessage = function(evt) {
    var f = document.getElementById("chatbox").contentDocument;
    var text = "";
    var msg = JSON.parse(evt.data);
    console.log(msg);
    var time = new Date(msg.date);
    var timeStr = time.toLocaleTimeString();

    switch(msg.type) {
      case "id":
        clientID = msg.id;
        setUsername();
        break;
      case "username":
        text = "<b>User <span style='color:" + msg.color + ";'>" + msg.name + "</span> signed in at " + timeStr + "</b><br>";
        break;
      case "message":
        text = "(" + timeStr + ") <span style='font-weight:bold;color:" + msg.color + ";'>" + msg.name + "</span>: " + msg.text + "<br>";
        break;
      case "rejectusername":
        text = "<b>Your username has been set to <em>" + msg.name + "</em> because the name you chose is in use.</b><br>";
        break;
      case "userlist":
        var ul = "";
        var i;

        for (i=0; i < msg.users.length; i++) {
          ul += msg.users[i] + "<br>";
        }
        document.getElementById("userlistbox").innerHTML = ul;
        break;
    }

    if (text.length) {
      f.write(text);
      var cw = document.getElementById("chatbox").contentWindow;
      cw.scrollBy(0, cw.innerHeight);
    }
  };
}

function send() {
  var msg = {
    text: document.getElementById("text").value,
    type: "message",
    id: clientID,
    date: Date.now(),
    color: idColors[clientID]
  };
  connection.send(JSON.stringify(msg));
  document.getElementById("text").value = "";
}

function handleKey(evt) {
  if (evt.keyCode === 13 || evt.keyCode === 14) {
    if (!document.getElementById("send").disabled) {
      send();
    }
  }
}

function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function getRandomColor() {
  h += g;
  h %= 1;
  rgb = HSVtoRGB(h, 0.5, 0.95);
  return '#' + rgb.r.toString(16) + rgb.g.toString(16) + rgb.b.toString(16);
}