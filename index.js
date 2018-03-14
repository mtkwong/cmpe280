const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5555;
const app = express();
const { Client } = require('pg');
const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});


app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));

app.get('/healthcampspa', function(req, res)) {
  /*
  dbClient.connect();

  dbClient.query('SELECT table_schema,table_name FROM information_schema.tables;', (err, res) => {
    if (err) throw err;
    for (let row of res.rows) {
      console.log(JSON.stringify(row));
    }
    dbClient.end();
  });*/

  res.render('pages/healthcampspa')
}

var server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

function stop() {
  server.close();
}

module.exports = app;
module.exports.stop = stop;