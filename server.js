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

var apiData = {
  //RK007189045FR
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
  //9261299997970843905411
  fedex: {
    host: 'fedex.com',
    path: '/Tracking?ascend_header=1&clienttype=dotcomreg&cntry_code=fr&language=french&tracknumbers=',
    data: false
  },
  gls: {
    host: 'www.gls-group.eu',
    path: '/276-I-PORTAL-WEB/content/GLS/FR01/FR/5004.htm?txtAction=71000&txtRefNo=',
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
  goshippo: {
    host: 'api.goshippo.com',
    path: '/v1/tracks/',
    data: false
  },
  //1Z88X862YW61068165
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

var couriers = [
  {
    slug: 'chronoposte',
    name: 'Chronoposte'
  },
  {
    slug: 'poste',
    name: 'La Poste'
  },
  {
    slug: 'ups',
    name: 'UPS'
  },
  {
    slug: 'fedex',
    name: 'Fedex'
  },
  {
    slug: 'gls_france',
    name: 'GLS'
  },
  {
    slug: 'dhl_express',
    name: 'DHL Express'
  }
];

var defPath = apiData.aftership.path;

function callAllApi(coli, res) {
  var found = false;
  var i = 0;
  var j = 0;
  
  
  for (i = 0; i < couriers.length; ++i) {
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
    	  	console.log("data got");
    	    str += chunk;
    	  });
    
    	  //the whole response has been recieved, so we just print it out here
    	  response.on('end', function () {
    	    console.log("end ", str);
    	    console.log("with api == ", api);
    	    if (found) return;
    	    try {
      	    ++j;
      	    var data = JSON.parse(str);
      	    
      	    if (api == 'chronoposte') {
      	      str = chronoposteEndPoint(data, coli);
      	    } else if (api == 'poste') {
      	      str = posteEndPoint(data, coli);
      	    }
      	    data = JSON.parse(str);
      	    console.log("data after parse is == ", data);
      	    if (data.tracking_status && data.tracking_status.status) found = true;
      	    
    	     } catch (e) {
            console.error("Parsing error:", e);
          }
          
          if (found) {
    	      res.send(str);
    	      return ;
    	    } else if (!found && i == j) {
    	      res.send(errorHandling("Unknown", coli));
    	    }
    	    
    	  });
    	}).end();
    })(couriers[i].slug);

  }
}

function chronoposteEndPoint(data, coli) {
  var res = {
    "carrier": "Chronopost",
    "tracking_number": coli,
    "address_from": null,
    "address_to": null,
    "eta": "",
    "tracking_status": {
      "status": data[data.length - 1].event,
      "status_details": data[data.length - 1].extra,
      "status_date": data[data.length - 1].date,
      "location": null
    },
    "tracking_history": []
  };
  
  for (var i = 0; i < data.length; ++i) {
    res.tracking_history.push({
      "status": data[i].event,
      "status_details": data[i].extra,
      "status_date": data[i].date,
      "location": {}
    });
  }
  
  return (JSON.stringify(res));  
}

function posteEndPoint(data, coli) {
  var res = {
    "carrier": data.type || "La poste",
    "tracking_number": coli,
    "address_from": null,
    "address_to": null,
    "eta": null,
    "tracking_status": {
      "status": data.status,
      "status_details": data.message,
      "status_date": data.date,
      "location": null
    },
    "tracking_history": []
  };
  
  return (JSON.stringify(res));  
}

function errorHandling(carrier, coli) {
  var c = couriers.filter(function(obj) {
    return (obj.slug == carrier);
  });
  console.log("carrier found is == " + c);
  var res = {
    "carrier": carrier,
    "tracking_number": coli,
    "address_from": null,
    "address_to": null,
    "eta": null,
    "tracking_status": null,
    "tracking_history": []
  };
  
  return (JSON.stringify(res));
}

function callapi(api, coli, res)
{
  if (api == "auto" || api == undefined) {
    return callAllApi(coli, res);  
  }

  var options;
  
  if (api != 'poste' && api != 'chronoposte') {
  	options = JSON.parse(JSON.stringify(apiData.goshippo));
    options.path += api + '/';
  } else {
    options = JSON.parse(JSON.stringify(apiData[api]));
  }

	options.path += coli;
	
  console.log("starting request to " + options.path, options.host);
	var req = https.request(options, function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	  	console.log("data got");
	    str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
	    console.log("end ", str);
	    try {
  	    var data = JSON.parse(str);
  	    if (api == 'chronoposte') {
  	      str = chronoposteEndPoint(data, coli);
  	    } else if (api == 'poste') {
  	      str = posteEndPoint(data, coli);
  	    }
	     } catch (e) {
        console.error("Parsing error:", e);
        str = errorHandling(api, coli);
      }
	    res.send(str);
	  });
	});
	
	req.on('error', (e) => {
    console.log(`problem with request: ${e.message}`);
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