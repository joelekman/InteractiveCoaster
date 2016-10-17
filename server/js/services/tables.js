/*
*   Sample service
*/
(function() {
    services.factory('Tables', ['$websocket', '$rootScope', function($websocket, $rootScope) {

        // PARAMS
        var lowLimit = 300;
        var noGlassLimit = 80;  

        /*
        *   Socket
        *   Socket stuff.
        */
        var dataStream = $websocket('ws://10.10.10.10:3000'); // Change to your IP address


        dataStream.send(JSON.stringify({
            command: 'ui'
        }));

        // We only deal with coaster state updates
        dataStream.onMessage(function(message) {
            try {
                var data = JSON.parse(message.data);
                data.lastActivity = Date.now(); // Milliseconds
                coasters["c" + data.id] = data;
                updateState();
            } catch (e) {
                console.log(e);
            }
        });

        var TABLE_KEY = "smartcoaster-tables";
        var COASTER_KEY = "smartcoaster-coasters";
        var INACTIVE_TIMEOUT = 1000*60*60; // 1 hour in Milliseconds
        var state = []; // State (read only)
        /*
        *   Data templates.
        */
        var coasters = JSON.parse(localStorage.getItem(COASTER_KEY));
        if(!coasters) {
            console.log("No coasters data from localStorage...");
            coasters = {};
        }
        var tables = JSON.parse(localStorage.getItem(TABLE_KEY));
        if(!tables) {
            console.log("No table data from localStorage...");
            tables = {};
        }

        var resetAttention = function(tId) {
            var index = findTable(tId);
            var coaster;
            if(index) {
                console.log("Found table", index);
                for(var c in tables[index].coasters) {
                    console.log("Coaster:", tables[index].coasters[c]);
                    coaster = tables[index].coasters[c];
                    delete coaster.weight;
                    coaster.attention = 0;
                    coaster.command = "coaster";
                    try {
                        dataStream.send(JSON.stringify(coaster));
                    }catch(e) {
                        console.log("Reset error!", e);
                    }
                }
            }
        };

        var sendTare = function() {
            dataStream.send(JSON.stringify({
                command: 'tare'
            }));
        };

        var sendCalibration = function() {
            var value = prompt("Value");
			if(value !== null) {
                dataStream.send(JSON.stringify({
                    command: 'calibrate',
                    calibration: value,
                }));
			}
        };

        var findCoaster = function(tId, cId) {
            for(var i in tables["t"+tId].coasters) {
                if(tables["t"+tId].coasters[i].id == cId) {
                    return i;
                }
            }
            return null;
        };

        var coasterInUse = function(cId) {
            for(var t in tables) {
                for(var c in tables[t].coasters) {
                    console.log("Coaster " + cId + "in use?");
                    if(tables[t].coasters[c].id == cId) {
                        console.log("Coaster " + cId + "in use! Table:", t);
                        return true;
                    }
                }
            }
            return false;
        };

        var tableExists = function(tId) {
            for(var t in tables) {
                if(tables[t].id == tId) {
                    return true;
                }
            }
            return false;
        };

        var findTable = function(tId) {
            for(var t in tables) {
                if(tables[t].id == tId) {
                    return t;
                }
            }
            return null;
        };

        var updateState = function() {
            console.log("Calculating state!", tables, coasters);
            localStorage.setItem(TABLE_KEY, JSON.stringify(tables));
            localStorage.setItem(COASTER_KEY, JSON.stringify(coasters));

            state = [];
            for(var t in tables) {
                table = tables[t];
                table.low = false;
                table.attention = false;
                table.temp = [];
                for(var c in table.coasters) {
                    var cId = "c"+table.coasters[c].id;
                    coaster = coasters[cId];
                    // Change data to coaster data or remove
                    if(coaster) {
                        if(coaster.attention == 1) {
                            table.attention = true;
                        }
                        if(coaster.weight < lowLimit && coaster.weight > noGlassLimit) {
                            table.low = true;
                        }
                        if(Math.abs(Date.now() - coaster.lastActivity) > INACTIVE_TIMEOUT) {
                            console.log("More than one our of inactivity for coaster:", coaster.id);
                            coaster.inactive = true;
                        }
                    } else {
                        coaster = {
                            id: cId.substring(1),
                            inactive: true
                        };
                    }
                    table.temp.push(coaster);
                }
                delete table.coasters;
                table.coasters = table.temp;
                delete table.temp;
                state.push(table);
            }
            return state;
        };

        // Init
        updateState();

        return {
            getState: function() {
                return state;
            },
            addTable: function(id) {
                console.log("Adding table with id:", id);
                if(!tableExists(id)) {
                    tables["t"+id] = {
                        id: id,
                        coasters: []
                    };
                    updateState();
                } else {
                    alert("Table already exists!");
                }

            },
            removeTable: function(id) {
                delete tables["t"+id];
                updateState();
            },
            addCoaster: function(tId, cId) {
                tId = "t"+tId;
                if(tables[tId] && !coasterInUse(cId)) {
                    console.log("Adding coaster", cId, "to", tId);
                    tables[tId].coasters.push({
                        id: cId,
                    });
                    updateState();
                } else {
                    alert("Coaster already in use!");
                }
            },
            removeCoaster: function(tId, cId) {
                console.log("Deleting coaster", cId, "from", tId);
                var i = findCoaster(tId, cId);
                if(i) {
                    tables["t"+tId].coasters.splice(i, 1);
                }
                updateState();
            },
            reset: function() {
                console.log("Clearing localStorage!");
                localStorage.clear();
                location.reload();
            },
            resetAttention: resetAttention,
            sendTare: sendTare,
            sendCalibration: sendCalibration,
        };
    }]);
})();
