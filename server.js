//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//

// set up ========================
var express  = require('express');
var app      = express();                               // create our app w/ express
//var mongoose = require('mongoose');                     // mongoose for mongodb
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var https = require('https');

var apiData = require('./server/apiData.js');
var couriers = require('./server/couriers.js');
var tools = require('./server/tools.js');
var enpointDpd = require('./server/endpointDpd.js');
var enpointTnt = require('./server/endpointTnt.js');
var enpointPoste = require('./server/endpointPoste.js');
var enpointChronopost = require('./server/endpointChronopost.js');

//var defPath = apiData.aftership.path;

function callAllApi(coli, res) {
  var found = false;
  var i = 0;
  var j = 0;
  
  //Do not test DPD
  for (i = 0; i < couriers.length - 1; ++i) {
    if (found) return;

    var options = {};
    
    if (couriers[i].slug != 'poste' && couriers[i].slug != 'chronoposte') {
    	options = JSON.parse(JSON.stringify(apiData.goshippo));
      options.path += couriers[i].slug + '/';
    } else {
      options = JSON.parse(JSON.stringify(apiData[couriers[i].slug]));
    }

	  options.path += coli;
	
    console.log("starting request in all to " + options.path, options.host);
    (function(api) {
      https.request(options, function(response) {
    	  var str = '';
  
    	  //another chunk of data has been recieved, so append it to `str`
    	  response.on('data', function (chunk) {
    	    str += chunk;
    	  });
    
    	  //the whole response has been recieved, so we just print it out here
    	  response.on('end', function () {
    	    console.log("end with api == ", api);
    	    if (found) return;
    	    try {
      	    ++j;
      	    var data = JSON.parse(str);
      	    
      	    if (api == 'chronoposte') {
      	      str = enpointChronopost.chronoposteEndPoint(data, coli);
      	    } else if (api == 'poste') {
      	      str = enpointPoste.posteEndPoint(data, coli);
      	    }
      	    data = JSON.parse(str);
      	    if (data.tracking_status && data.tracking_status.status) found = true;
      	    
    	     } catch (e) {
            console.error("Parsing error:", e);
          }
          
          if (found) {
    	      res.send(str);
    	      return ;
    	    } else if (!found && i == j) {
    	      console.log("not found with i == ", i, " and api == ", api, " j == ", j, " found == ", found);
            return (enpointDpd.doDpdCall(coli, JSON.parse(JSON.stringify(apiData["dpd"])), res, "Unknonw"));
    	    }
    	    
    	  });
    	}).end();
    })(couriers[i].slug);

  }
}

function callapi(api, coli, res)
{
  if (api == "auto" || api == undefined) {
    return callAllApi(coli, res);  
  }

  var options;
  
  if (api != 'poste' && api != 'chronoposte' && api != 'dpd' && api != 'tnt') {
  	options = JSON.parse(JSON.stringify(apiData.goshippo));
    options.path += api + '/';
  } else {
    options = JSON.parse(JSON.stringify(apiData[api]));
  }
  if (api != 'dpd') options.path += coli;
  else {
    return enpointDpd.doDpdCall(coli, options, res, "DPD");
  }

  console.log("starting request to " + options.path, options.host);
	var req = https.request(options, function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	    str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
	    if (api == 'tnt') return (enpointTnt.parseTntInfo(coli, res, str));
	    try {
  	    var data = JSON.parse(str);
  	    console.log("data got in end are == ", data);
  	    if (api == 'chronoposte') {
  	      str = enpointChronopost.chronoposteEndPoint(data, coli);
  	    } else if (api == 'poste') {
  	      str = enpointPoste.posteEndPoint(data, coli);
  	    }
	     } catch (e) {
        console.error("Parsing error:", e);
        str = tools.errorHandling(api, coli);
      }
	    res.send(str);
	  });
	});
	
	req.on('error', (e) => {
    console.log(`problem with request: ${e.message}`);
    res.send(`problem with request: ${e.message}`)
  });
  
	if (options.method == 'POST') {
	  req.write(JSON.stringify(options.data));
    console.log("writing the data == ", JSON.stringify(options.data));
	}
  req.end();
}

// configuration =================

//mongoose.connect('mongodb://node:nodeuser@mongo.onmodulus.net:27017/uwO3mypu');     // connect to mongoDB database on modulus.io

app.use(express.static(__dirname + '/client'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());

app.post('/send', function(req, res) {
  callapi(req.body.api, req.body.coli, res);
  console.log("sending done");
});

app.get('/couriers', function(req, res) {
	  res.send(JSON.stringify({'data': {'couriers': couriers}}));
});

app.get('*', function(req, res) {
    res.sendfile('./client/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});
    
// listen (start app with node server.js) ======================================
app.listen(process.env.PORT || 3000);
console.log("App listening on port " + (process.env.PORT || 3000));