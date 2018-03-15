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
  console.log(req.body);
  const text = 'INSERT INTO healthrecords(ID, FirstName, LastName, Gender, Age, Details, Photo) VALUES($1, $2, $3, $4, $5, $6, $7)';
  const values = [req.body.id, req.body.fn, req.body.ln, req.body.gn, req.body.ag, req.body.dt, req.body.ph];
  //res.contentType('json');
  //res.send(JSON.stringify({response:'hello my world'}));
  
  dbClient.connect();
  dbClient.query(text, values, (err, res) => {
    if (err) {
      console.log(err);
    }
    /*
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }*/
    dbClient.end();
  });
});

app.post('/saveHealthInfo', function(req, res) {
  ;
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