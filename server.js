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
var htmlparser = require("htmlparser");
var https = require('https');
var http = require('http');

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
  tnt: {
    host: 'www.tnt.fr',
    path: '/public/suivi_colis/recherche/visubontransport.do?radiochoixrecherche=BT&bonTransport='
  },
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
  dpd: {
    host: 'e-trace.ils-consult.fr',
    path: '/exa-webtrace/Webtrace.aspx?cmd=SDG_SEARCH_EXACT&sprache=',
    port: 80
  },
  goshippo: {
    host: 'api.goshippo.com',
    path: '/v1/tracks/',
    data: false
  },
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
  //XX123456789FR
  {
    slug: 'chronoposte',
    name: 'Chronoposte'
  },
  //RK007189045FR
  {
    slug: 'poste',
    name: 'La Poste'
  },
  //1Z88X862YW61068165
  {
    slug: 'ups',
    name: 'UPS'
  },
  //9261299997970843905411
  {
    slug: 'fedex',
    name: 'Fedex'
  },
  {
    slug: 'gls_france',
    name: 'GLS'
  },
  //2653513914
  {
    slug: 'dhl_express',
    name: 'DHL Express'
  },
  //444576672
  {
    slug: 'tnt',
    name: 'TNT'
  },
  //2500183095289110
  {
    slug: 'dpd',
    name: 'DPD'
  }
];

var defPath = apiData.aftership.path;

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
    	      console.log("not found with i == ", i, " and api == ", api, " j == ", j, " found == ", found);
            return (doDpdCall(coli, JSON.parse(JSON.stringify(apiData["dpd"])), res, "Unknonw"));
    	    }
    	    
    	  });
    	}).end();
    })(couriers[i].slug);

  }
}

function chronoposteEndPoint(data, coli) {
  var findVille = function(event) {
    var index = event.indexOf('\n');
    return (event.slice(0, index));
  };
  
  var findStatus= function(event) {
    var index = event.indexOf('\n');
    return (event.slice(index));
  };
  
  var res = {
    "carrier": "Chronopost",
    "tracking_number": coli,
    "address_from":  {
        "city": findVille(data[0].event),
        "state": "",
        "zip":  "",
        "country": ""
      },
    "address_to":  {
        "city": findVille(data[data.length - 1].event),
        "state": "",
        "zip":  "",
        "country": ""
      },
    "eta": "",
    "tracking_status": {
      "status": findStatus(data[data.length - 1].event),
      "status_details": data[data.length - 1].extra,
      "status_date": data[data.length - 1].date,
      "location": {
        "city": findVille(data[data.length - 1].event),
        "state": "",
        "zip":  "",
        "country": ""
      }
    },
    "tracking_history": []
  };
  
  for (var i = 0; i < data.length - 1; ++i) {
    res.tracking_history.push({
      "status": findStatus(data[i].event),
      "status_details": data[i].extra,
      "status_date": data[i].date,
      "location": {
        "city": findVille(data[i].event),
        "state": "",
        "zip":  "",
        "country": ""
      }
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
  console.log("carrier found is == " + carrier);
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

function findElemeByAttribute(haystack, attribute, value) {
  var res = haystack.filter(function(obj) {
      return (obj.attribs && obj.attribs[attribute] == value);
  });

  if (res.length > 0) return res;
  for (var i = 0; i < haystack.length; ++i) {
      if (haystack[i].children && haystack[i].children.length > 0) res = findElemeByAttribute(haystack[i].children, attribute, value);
      if (res.length > 0) return res;
  }
  return [];
}

function findElemeByName(needle, haystack) {
  return haystack.filter(function(obj) {
    return (obj.name == needle);
  });
}

function getDataFromHtmlDpd(dom) {
  var tracking_history = [];
  
  try {
    var html = findElemeByName("html", dom);

    var body = findElemeByName("body", html[0].children);
    
    var container = findElemeByAttribute(body[0].children, "class", "table_container");
  
    var table = findElemeByName("table", container[0].children);
    var tbody = findElemeByName("tbody", table[0].children);
  
    var histo = tbody[0].children;
    
    
    for (var i = 0; i < histo.length; ++i) {
      var ville = histo[i].children[3].children[0].children[0].data;
      var location = null;
      if (ville && ville != "&nbsp;") {
        var indexOfZip = ville.indexOf("(") + 1;
        var lastIndexOfZip = ville.indexOf(")");
        var zip = ville.slice(indexOfZip, lastIndexOfZip);
        if (zip.length > 2 && zip[0] != '9') zip = "";
        
        location = {
          "city": ville.slice(0, indexOfZip - 1),
          "state": "",
          "zip": zip,
          "country": ""
        };
      }
  
      tracking_history.push({
        "status": "UNKOWN",
        "status_details": histo[i].children[2].children[0].children[0].data.slice(0, -6),
        "status_date": histo[i].children[0].children[0].children[0].data + " " + histo[i].children[1].children[0].children[0].data,
        "location": location
      });
    }
  } catch(e) {
    console.log("error got: ", e);
  }
  return tracking_history;
}

function doDpdCall(coli, options, res, courier) {
  options.path += '&sdg_landnr=' + coli.slice(0, 3);
  options.path += '&sdg_mandnr=' + coli.slice(3, 6);
  options.path += '&sdg_lfdnr=' + coli.slice(6);
  console.log("PATH IN GET DPD PATH IS == ", options.path);
  
  var req = http.request(options, function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
	  	console.log("data got");
	    str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
	    var handler = new htmlparser.DefaultHandler(function (error, dom) {
          if (error)
              console.log("ERROR WHILE PARSING");
          else {
            var histo = getDataFromHtmlDpd(dom).reverse();
            if (histo.length == 0) {
              return res.send(errorHandling(courier, coli));
            }
            var last_histo = histo.pop();
            
            var toSend = {
              "carrier": "DPD",
              "tracking_number": coli,
              "address_from": histo[0].location,
              "address_to": last_histo.location,
              "eta": null,
              "tracking_status": last_histo,
              "tracking_history": histo
            };
            
      	    res.send(JSON.stringify(toSend));
          }
      }, { verbose: false, ignoreWhitespace: true });
      var parser = new htmlparser.Parser(handler);
      parser.parseComplete(str);

	  });
	});
	
	req.on('error', (e) => {
    console.log(`problem with request: ${e.message}`);
    res.send(`problem with request: ${e.message}`)
  });
  req.end();
}

function decodeHtml(str) {
  console.log("try to decode ", str);
  return (str.replace(/&#233;/g, "é").replace(/&#231;/g, "ç"));
}

function getDataFromHtmlTnt(dom) {
  var tracking_history = [];
  
  try {
    var html = findElemeByName("html", dom);
    console.log("html is == ", html);
    var body = findElemeByName("body", html[0].children);
    var content = findElemeByAttribute(body[0].children, "class", "result__content");
    var histo = content[0].children;
    
    for (var i = 0; i < histo.length; ++i) {
      var ville = histo[i].children[2].children[0].data.trim().replace(/&nbsp;/gm,'');
      var date = histo[i].children[1].children[0].data.trim().replace(/&nbsp;:&nbsp;/gm,' ').replace(/\n/gm,'').replace(/\t/gm,'');
      var status = histo[i].children[0].children[0].data.trim().replace(/&nbsp;/gm,'').replace(/\n/gm,'').replace(/\t/gm,'');
      var location =  {
          "city": decodeHtml(ville),
          "state": "",
          "zip": "",
          "country": ""
        };
  
      tracking_history.push({
        "status": "UNKOWN",
        "status_details": decodeHtml(status),
        "status_date": decodeHtml(date),
        "location": location
      });
    }
  } catch(e) {
    console.log("error got in TNT parse: ", e);
  }
  return tracking_history;
}

function parseTntInfo(coli, res, str) {
  var handler = new htmlparser.DefaultHandler(function (error, dom) {
      if (error)
          console.log("ERROR WHILE PARSING ", error);
      else {
        var histo = getDataFromHtmlTnt(dom).reverse();
        console.log("data got are = ", histo);
        if (histo.length == 0) {
          return res.send(errorHandling("TNT", coli));
        }
        var last_histo = histo.pop();
        
        var toSend = {
          "carrier": "DPD",
          "tracking_number": coli,
          "address_from": histo[0].location,
          "address_to": last_histo.location,
          "eta": null,
          "tracking_status": last_histo,
          "tracking_history": histo
        };
        
  	    res.send(JSON.stringify(toSend));
      }
  }, { verbose: false, ignoreWhitespace: true });
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(str);
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
    return doDpdCall(coli, options, res, "DPD");
  }

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
	    if (api == 'tnt') return (parseTntInfo(coli, res, str));
	    try {
  	    var data = JSON.parse(str);
  	    console.log("data got are == ", data);
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