var scotchTodo = angular.module('scotchTodo', []);

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
                if (!data.tracking_status) {
                    data.tracking_status = {
                        "status_details": "Impossible de trouver votre coli."
                    };
                }
                if (!data.tracking_status.status) {
                    data.tracking_status.status = "UNKOWN"
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