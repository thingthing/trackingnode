module.exports = {
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
