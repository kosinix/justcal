const express = require('express');
const expressNunjucks = require('express-nunjucks');
const moment = require('moment');
const bodyParser = require('body-parser')
const lodash = require('lodash');
const jsonloader = require('jsonloader'); // json-loader
const calendar = require('./src/calendar');
const training = require('./src/training');

// App
const app = express();
const isDev = app.get('env') === 'development';

// Views
app.set('views', __dirname + '/views');
app.use(express.static('public'));
const njk = expressNunjucks(app, {
    watch: isDev,
    noCache: isDev,
    globals: {
      baseUrl: "http://localhost:3000",
      title: "Calendar"
    }
});

// Parse http body
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

function defaulter(req,res,next){
  var now = moment();
  var year = now.format('YYYY'); // 1970 1971 ... 2029 2030

  if(req.query.year){ 
    year = moment(req.query.year+'-01-01', 'YYYY-MM-DD');
    if(!year.isValid()){
      res.send('Invalid year. Example format: 1970 1971 ... 2029 2030');
    }
    year = year.format('YYYY');
  }
  req.query.year = year;

  var month = now.format('MM'); // 01 02 ... 11 12

  if(req.query.month){
    month = moment(year+'-'+req.query.month+'-01', 'YYYY-MM-DD');
    if(!month.isValid()){
      res.send('Invalid month. Example format: 01 02 ... 11 12');
    }
    month = month.format('MM')
  }
  req.query.month = month;

  next();
}

app.use(defaulter);

// Routes
app.get('/', (req, res) => {

  res.send('Running...');
});
app.get('/month/:year/:month', (req, res) => {

  var now = moment();
  // TODO: sanity checks
  var year = req.params.year;
  var month = req.params.month;
  var weekStart = 6; // 0-6. Where 0 is Sun, 1 is Mon ... so on..
  var padMode = 0; // 0 - Blank pads. 1 - Use neighboring calendar days.
  var cal = calendar.calendarMonth(parseInt(month)-1, year, weekStart, padMode);
  var weekDays = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
  var weekDays = lodash.concat(lodash.slice(weekDays, weekStart), lodash.slice(weekDays, 0, weekStart));
  var vars = {
    month: cal,
    now: now,
    weekDays: weekDays
  };

  res.render('month.html', vars );
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

var sqlite3 = require('sqlite3').verbose()
var db = new sqlite3.Database('app.db')

// db.serialize(function () {
//   db.run('CREATE TABLE IF NOT EXISTS lorem (info TEXT)')
//   var stmt = db.prepare('INSERT INTO lorem VALUES (?)')

//   for (var i = 0; i < 10; i++) {
//     stmt.run('Ipsum ' + i)
//   }

//   stmt.finalize()

//   db.each('SELECT rowid AS id, info FROM lorem', function (err, row) {
//     console.log(row.id + ': ' + row.info)
//   })
// })

db.close()