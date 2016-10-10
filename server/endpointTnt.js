var tools = require('./tools.js');
var htmlparser = require("htmlparser");

function decodeHtml(str) {
  console.log("try to decode ", str);
  return (str.replace(/&#233;/g, "é").replace(/&#231;/g, "ç"));
}

function getDataFromHtmlTnt(dom) {
  var tracking_history = [];
  
  try {
    var html = tools.findElemeByName("html", dom);
    var body = tools.findElemeByName("body", html[0].children);
    var content = tools.findElemeByAttribute(body[0].children, "class", "result__content");
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
          return res.send(tools.errorHandling("TNT", coli));
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

module.exports = {
    getDataFromHtmlTnt: getDataFromHtmlTnt,
    parseTntInfo: parseTntInfo
};