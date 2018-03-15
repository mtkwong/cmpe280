const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5555;
const app = express();
const { Client } = require('pg');
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});


app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.get('/healthcamp', (req, res) => res.render('pages/health_camp_spa'));

app.post('/savePersonalInfo', function(req, res) {
  console.log(req.body);
  /*
  dbClient.connect();

  dbClient.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    dbClient.end();
  });*/
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