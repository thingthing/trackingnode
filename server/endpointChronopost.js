module.exports = {
  chronoposteEndPoint: function(data, coli) {
      var findVille = function(event) {
        var index = event.indexOf('\n');
        return (event.slice(0, index));
      };
      
      var findStatus = function(event) {
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
};