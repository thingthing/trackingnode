module.exports = {
    findElemeByAttribute: function(haystack, attribute, value) {
      var res = haystack.filter(function(obj) {
          return (obj.attribs && obj.attribs[attribute] == value);
      });
    
      if (res.length > 0) return res;
      for (var i = 0; i < haystack.length; ++i) {
          if (haystack[i].children && haystack[i].children.length > 0) res = this.findElemeByAttribute(haystack[i].children, attribute, value);
          if (res.length > 0) return res;
      }
      return [];
    },
    
    findElemeByName: function(needle, haystack) {
      return haystack.filter(function(obj) {
        return (obj.name == needle);
      });
    },
    
    errorHandling: function(carrier, coli) {
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
}