(function() {
    app.config(['$stateProvider', '$locationProvider', '$urlRouterProvider', function($stateProvider, $locationProvider, $urlRouterProvider) {
        // the known route
        $urlRouterProvider.when('', '/');
        $stateProvider
        .state('base', {
            url: '/',
            abstract: true,
            views: {
                layout: {
                    templateUrl: 'views/layouts/base.html'
                }
            }
        })
        .state('base.index', {
            url: '',
            views: {
                main: {
                    controller: 'mainCtrl',
                    templateUrl: 'views/index.html'
                }
            }
        })
        // Catch all
        .state("otherwise", {
            url: "*path",
            templateUrl: "views/404.html"
        });

        /*
        * This requires server configuration
        * In head: <base href="/">
        */
        //$locationProvider.html5Mode(true).hashPrefix('!');
    }]);
})();
