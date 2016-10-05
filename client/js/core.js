var scotchTodo = angular.module('scotchTodo', []);
var directionsService;
var directionsDisplay;

function initMap() {
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 6,
      center: {lat: 48, lng: 2}
    });
    directionsDisplay.setMap(map);
    
    // document.getElementById('submit').addEventListener('click', function() {
    //   calculateAndDisplayRoute(directionsService, directionsDisplay);
    // });
}
    
function calculateAndDisplayRoute(directionsService, directionsDisplay, origin, destination, histo) {
    if (!origin || !destination) return ;
    var waypts = [];
    // 8 is the max number of waypoint
    for (var i = 0; i < histo.length && i < 8; i++) {
        waypts.push({
          location: histo[i].city + ', ' + histo[i].country + ', ' + histo[i].zip + ', ' + histo[i].state,
          stopover: true
        });
    }
    console.log("origin == ", origin);
    console.log("destination == ", destination);
    directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypts,
      optimizeWaypoints: true,
      travelMode: 'DRIVING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
      } else {
        console.log('Directions request failed due to ' + status);
      }
    });
}
      
function mainController($scope, $http) {
    $scope.formData = {api : "auto"};
    $scope.main = null;

    // when landing on the page, get all todos and show them
    $http.get('/couriers')
        .success(function(data) {
            $scope.couriers = data.data.couriers;
            console.log($scope.couriers);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    // when submitting the add form, send the text to the node API
    $scope.send = function() {
        $http.post('/send', $scope.formData)
            .success(function(data) {
                $scope.panelClass = "primary";
                if (!data.tracking_status) {
                    data.tracking_status = {
                        "status_details": "Impossible de trouver votre coli."
                    };
                    $scope.panelClass = "danger";
                }
                
                if (!data.tracking_status.status) {
                    data.tracking_status.status = "UNKOWN";
                    $scope.panelClass = "danger";
                }
                //$scope.formData = {}; // clear the form so our user is ready to enter another or not
                $scope.main = data;
                initMap();
                
                if (data.address_from || data.address_to) {
                    var destination = '';
                    var origin = '';
                    if (data.address_from) {
                        origin = data.address_from.city + ', ' + data.address_from.country + ', ' + data.address_from.zip + ', ' + data.address_from.state;
                    }
                    if (data.address_to) {
                        destination = data.address_to.city + ', ' + data.address_to.country + ', ' + data.address_to.zip + ', ' + data.address_to.state;
                    }
                    var histo = [];
                    var first_loc = {};
                    
                    for (var i = 0; i < data.tracking_history.length; ++i) {
                        histo.push(data.tracking_history[i].location);
                        if (data.tracking_history[i].location) first_loc = data.tracking_history[i].location;
                    }
                    
                    if (!origin) origin = first_loc.city + ', ' + first_loc.country + ', ' + first_loc.zip + ', ' + first_loc.state;
                    
                    calculateAndDisplayRoute(directionsService, directionsDisplay, origin, destination, histo);
                } 
                //if (data.meta.code != 200) $scope.main = data.meta.message;
                //else $scope.main = data.data;
                console.log("In angular data = ", data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
}