var scotchTodo = angular.module('scotchTodo', []);

function initMap() {
    var directionsService = new google.maps.DirectionsService;
    var directionsDisplay = new google.maps.DirectionsRenderer;
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 6,
      center: {lat: 41.85, lng: -87.65}
    });
    directionsDisplay.setMap(map);
    
    // document.getElementById('submit').addEventListener('click', function() {
    //   calculateAndDisplayRoute(directionsService, directionsDisplay);
    // });
}
    
function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    var waypts = [];
    var checkboxArray = document.getElementById('waypoints');
    for (var i = 0; i < checkboxArray.length; i++) {
      if (checkboxArray.options[i].selected) {
        waypts.push({
          location: checkboxArray[i].value,
          stopover: true
        });
      }
    }
    
    directionsService.route({
      origin: document.getElementById('start').value,
      destination: document.getElementById('end').value,
      waypoints: waypts,
      optimizeWaypoints: true,
      travelMode: 'DRIVING'
    }, function(response, status) {
      if (status === 'OK') {
        directionsDisplay.setDirections(response);
        var route = response.routes[0];
        var summaryPanel = document.getElementById('directions-panel');
        summaryPanel.innerHTML = '';
        // For each route, display summary information.
        for (var i = 0; i < route.legs.length; i++) {
          var routeSegment = i + 1;
          summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
              '</b><br>';
          summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
          summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
          summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
        }
      } else {
        window.alert('Directions request failed due to ' + status);
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
                //if (data.meta.code != 200) $scope.main = data.meta.message;
                //else $scope.main = data.data;
                console.log("In angular data = ", data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };
}