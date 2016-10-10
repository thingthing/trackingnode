module.exports = {
    posteEndPoint: function(data, coli) {
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
}