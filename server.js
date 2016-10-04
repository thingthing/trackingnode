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
var querystring = require('querystring');
var https = require('https');

var upsAPI = require('shipping-ups');

var ups = new upsAPI({
  environment: 'live', // or sandbox
  username: 'thingthing',
  password: 'MJ]n6;-6Rc^#Z2LhS>ea',
  access_key: '6D170498A309C648',
  imperial: false // set to false for metric
});
  
var apiData = {
  poste: {
    host: 'api.laposte.fr',
    path: '/suivi/v1/',
    headers :{
      'Content-Type': 'application/json',
      'X-Okapi-Key' : 'Pubnuuw3sf5NItBPpuvMP9YPI0r3cudky83Bn4dd5Zb2TFO2x7KDY4KnH0fjdvRp'
    },
    data: false
  },
  //XX123456789FR
  chronoposte: {
    host: 'www.chrono-api.fr',
    port: 8484,
    "rejectUnauthorized": false, 
    path: '/services/postage/chronopost/df8d2738-f342-4a81-9e19-05294fcd8b29/parcel/tracking/infos/FR/',
    headers: {
      'Content-Type': 'application/json',
    },
    data: false
  },
  fedex: {
    host: 'fedex.com',
    path: '/Tracking?ascend_header=1&clienttype=dotcomreg&cntry_code=fr&language=french&tracknumbers=',
    data: false
  },
  aftership:{
    host: 'api.aftership.com',
    path: '/v4/trackings/',
    headers: {
      'Content-Type': 'application/json',
      'aftership-api-key': 'bbf9f89d-38c9-4c48-af10-de9cd66fed6e'
    },	
  },
  //1Z999AA10123456784
  ups: {
    host: 'onlinetools.ups.com',
    path: '/rest/Track/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    },
    data: {
      "UPSSecurity": {
        "UsernameToken": {
          "Username": "thingthing",
          "Password": "MJ]n6;-6Rc^#Z2LhS>ea"
         },
        "ServiceAccessToken": {
          "AccessLicenseNumber": "6D170498A309C648"
        }
      },
      "TrackRequest": {
        "Request": {
          "RequestOption": "1",
          "TransactionReference": {
            "CustomerContext": "Your Test Case Summary Description"
          }
        },
        "InquiryNumber": ""
      }
    }
  }
};

var couriers = [];

var defPath = apiData.aftership.path;

function callAllApi(coli, res) {
  var found = false;
  var i = 0;
  var j = 0;
  
  var callback = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	  	console.log("data got");
	    str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
	  	console.log("end");
	    console.log(str);
	    var data = JSON.parse(str);
	    ++j;
	    if (data.meta.code == 200 && !found) {
	      found = true;
	      res.send(str);
	    } else if (!found && i == j) {
	      res.send(str);
	    }
	  });
	}
	
  for (i = 0; i < couriers.length; ++i) {
    	var options = apiData.aftership;
      console.log("slug are == " + couriers[i].slug);
      options.path = defPath + couriers[i].slug + '/' + coli;
    	
      console.log("starting request to " + options.path);
    	https.request(options, callback).end();
  }
}

function callapi(api, coli, res)
{
  if (api == "auto" || api == undefined) {
    return callAllApi(coli, res);  
  }
  
  if (api == "ups"){
      ups.track(coli, function(err, result) {
        console.log("ups result == ", result);
        console.log("error == ", err);
        if (err) res.send(err.ErrorDescription);
        else res.send(JSON.stringify(result));
      });
    return ;
  }
	var options = JSON.parse(JSON.stringify(apiData[api]));
  console.log("api found is == " + api);

	if (!apiData[api].data) options.path += coli;
  else options.data.TrackRequest.InquiryNumber = coli;
	
	var callback = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	  	console.log("data got");
	    str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
	    console.log("end ", str);
	    res.send(str);
	  });
	}
  console.log("starting request to " + options.path);
	var req = https.request(options, callback);
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
    couriers = [
      {
        slug: 'poste',
        name: 'La Poste'
      },
      {
        slug: 'chronoposte',
        name: 'Chronoposte'
      },
      {
        slug: 'ups',
        name: 'UPS'
      }
    ];
	  res.send(JSON.stringify({'data': {'couriers': couriers}}));
});

app.get('*', function(req, res) {
    res.sendfile('./client/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});
    
// listen (start app with node server.js) ======================================
app.listen(process.env.PORT || 3000);
console.log("App listening on port " + (process.env.PORT || 3000));