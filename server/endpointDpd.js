var tools = require('./tools.js');
var htmlparser = require("htmlparser");
var http = require('http');

var getDataFromHtmlDpd = function(dom) {
  var tracking_history = [];
  
  try {
    var html = tools.findElemeByName("html", dom);

    var body = tools.findElemeByName("body", html[0].children);
    
    var container = tools.findElemeByAttribute(body[0].children, "class", "table_container");
  
    var table = tools.findElemeByName("table", container[0].children);
    var tbody = tools.findElemeByName("tbody", table[0].children);
  
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

var doDpdCall = function(coli, options, res, courier) {
  options.path += '&sdg_landnr=' + coli.slice(0, 3);
  options.path += '&sdg_mandnr=' + coli.slice(3, 6);
  options.path += '&sdg_lfdnr=' + coli.slice(6);

  var req = http.request(options, function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
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
              return res.send(tools.errorHandling(courier, coli));
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

module.exports = {
    getDataFromHtmlDpd: getDataFromHtmlDpd,
    doDpdCall: doDpdCall
}