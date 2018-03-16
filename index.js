const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
//const multer = require('multer');
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
app.get('/healthcamp', (req, res) => res.render('pages/health_camp_spa'));

app.post('/savePersonalInfo', function(req, res) {
  const text = 'INSERT INTO healthrecords(ID, FirstName, LastName, Gender, Age, Details, Photo) VALUES($1, $2, $3, $4, $5, $6, $7)';
  const values = [req.body.id, req.body.fn, req.body.ln, req.body.gn, req.body.ag, req.body.dt, req.body.ph];
  
  dbClient.connect();
  dbClient.query(text, values, (err, res) => {
    if (err) {
      console.log(err);
    }
    dbClient.end();
  });
  res.sendStatus(200);
});

app.post('/saveHealthInfo', function(req, res) {
  console.log(req.body);
  const text = 'UPDATE Records SET Height=$1, Weight=$2, BodyTemp=$3, Pulse=$4, BloodPressure=$5, Medications=$6, Notes=$7 WHERE ID=$8';
  const values = [req.body.ht, req.body.wt, req.body.bt, req.body.pr, req.body.bp, req.body.md, req.body.nt, req.body.id];
  
  dbClient.connect();
  dbClient.query(text, values, (err, res) => {
    if (err) {
      console.log(err);
    }
    dbClient.end();
  });
  res.sendStatus(200);
});

app.get('/retrieveInfo', function(req, res) {
  ;
});

var server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

function stop() {
  server.close();
}

module.exports = app;
module.exports.stop = stop;