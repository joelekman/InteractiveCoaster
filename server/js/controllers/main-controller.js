(function() {
	controllers.controller("mainCtrl", ['$scope', 'Tables', function($scope, Tables) {
		$scope.state = Tables.getState;

		$scope.addTable = function() {
			var tableId = prompt("What table number (id) do you want to add?");
			if(tableId !== null) {
				Tables.addTable(tableId);
			}
		};

		$scope.reset = function() {
			if (confirm("Are you sure you want to reset ALL data?")) {
				Tables.reset();
			}
		};

		$scope.tare = function() {
			if (confirm("Are you sure you want tare all coasters?")) {
				Tables.sendTare();
			}
		};
		$scope.calibrate = function() {
			Tables.sendCalibration();
		};
	}]);

	controllers.controller("coasterCtrl", ['$scope', 'Tables', '$timeout', function($scope, Tables, $timeout) {
		$scope.removeToggle = false;

		$scope.youSure = function() {
			$scope.removeToggle = true;
			$timeout(function() {
				$scope.removeToggle = false;
			}, 1000);
		};

		$scope.remove = function(tId, cId) {
			Tables.removeCoaster(tId, cId);
		};
	}]);

	controllers.controller("tableCtrl", ['$scope', 'Tables', '$timeout', function($scope, Tables, $timeout) {
		$scope.id = null;

		$scope.removeTable = function(id) {
			if (confirm("Are you sure you want to remove this table?")) {
				Tables.removeTable(id);
			}
		};

		$scope.addCoaster = function(tableId) {
			var coasterId = prompt("What is the coaster ID? (Found on the back)");
			if(coasterId !== null) {
				Tables.addCoaster(tableId, coasterId);
			}
		};

		$scope.setId = function(id) {
			$scope.id = id;
		};

		$scope.resetAttention = function(tId) {
			Tables.resetAttention(tId);
		};
	}]);
})();
