/*
*   Table directive
*/
(function() {
    directives.directive('tableView', [function() {
        var TABLE_KEY = "smartcoaster-table-";
        var parent = null;
        return {
            restrict: 'AE',
            scope: {
                data: "=data"
            },
            link: function(scope, elem, attr) {
                var position = JSON.parse(localStorage.getItem(TABLE_KEY + attr.tableId));
                var parent = elem.parent()[0];
                if(position === null) {
                    position = {
                        x: parent.offsetLeft,
                        y: parent.offsetTop
                    };
                }
                var draggie = new Draggabilly( elem[0], {
                    containment: '#container'
                });

                angular.element(elem[0]).css({'top': (position.y) + "px", 'left': (position.x) + "px"});

                // Drag end
                draggie.on('dragEnd', function( event, pointer) {
                    localStorage.setItem(TABLE_KEY + attr.tableId, JSON.stringify({x: elem[0].offsetLeft, y: elem[0].offsetTop}));
                });

                // When removing the table
                scope.$on('$destroy', function() {
                    localStorage.removeItem(TABLE_KEY + attr.tableId);
                });
            },
            templateUrl: 'views/templates/table.html'
        };
    }]);

})();
