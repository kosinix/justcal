const express = require('express');
const expressNunjucks = require('express-nunjucks');
const moment = require('moment');
const bodyParser = require('body-parser')
const lodash = require('lodash');
const jsonloader = require('jsonloader'); // json-loader
const kalendaryo = require('./src/kalendaryo');

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
  var def = moment.utc().format('YYYY/MM');
  res.redirect(def);
});

app.get('/:year/:month', (req, res) => {
  var now = moment();

  // TODO: sanity checks
  var year = parseInt(req.params.year);
  var month = parseInt(req.params.month);
  var timeZone = 0; // Possible values: -12 to 14

  var monthView = new kalendaryo.MonthView(year, month, {
    weekStart: 0,  // 0-6. Where 0 is Sun, 1 is Mon ... so on..
    padMode: 1, // 0 - Blank pads. 1 - Use neighboring calendar days.
    dayCallBack: function(dateObj){
      dateObj.extra = 'This is an extra info added';
      return dateObj;
    }
  });
  
  var vars = {
    month: monthView,
    now: now
  };

  res.render('month.html', vars );
});

app.listen(3002, function () {
  console.log('Example app listening on port 3002!')
});
