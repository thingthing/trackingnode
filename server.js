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

var apiData = {
  poste: {
    host: 'api.laposte.fr',
    path: '/suivi/v1/',
    data: false
  },
  chronoposte: {
    host: 'www.chrono-api.fr',
    port: 8484,
    path: '/services/postage/chronopost/df8d2738-f342-4a81-9e19-05294fcd8b29/parcel/tracking/infos/FR/',
    data: false
  },
  fedex: {
    host: 'fedex.com',
    path: '/Tracking?ascend_header=1&clienttype=dotcomreg&cntry_code=fr&language=french&tracknumbers',
    data: false
  },
  ninjavan: {
    host: 'api.ninjavan.sg',
    path: '/2.0/orders/',
    port: 443,
  },
  aftership:{
    host: 'api.aftership.com',
    path: '/v4/trackings/',
    headers: {
      'Content-Type': 'application/json',
      'aftership-api-key': 'bbf9f89d-38c9-4c48-af10-de9cd66fed6e'
    },	
  },
  ups: {
    host: 'wwwcie.ups.com',
    path: '/rest/Track/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
	      console.log("i == " + i + " -- j  == " + j);
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
  // if (api == "auto" || api == undefined) {
  //   return callAllApi(coli, res);  
  // }
  //if (!apiData[api].data) apiData[api].path += coli;
  //else apiData[api].data.TrackRequest.InquiryNumber = coli;

	var options = apiData.chronoposte;
  console.log("api found is == " + api);
  options.path = apiData.chronoposte.path + coli;
	
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
	    res.send(str);
	  });
	}
  console.log("starting request to " + options.path);
	var req = https.request(options, callback);
	//if (apiData[api].data) req.write(querystring.stringify(apiData[api].data));
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
	    couriers = JSON.parse(str).data.couriers;
	    res.send(str);
	  });
	}
	https.request({
    host: 'api.aftership.com',
    path: '/v4/couriers/',
    headers: {
      'Content-Type': 'application/json',
      'aftership-api-key': 'bbf9f89d-38c9-4c48-af10-de9cd66fed6e'
    },	
  }, callback).end();
});

app.get('*', function(req, res) {
    res.sendfile('./client/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});
    
// listen (start app with node server.js) ======================================
app.listen(process.env.PORT || 3000);
console.log("App listening on port " + (process.env.PORT || 3000));
    
/*var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
*/