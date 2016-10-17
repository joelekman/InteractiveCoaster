angular.module('app.config', [])
// Constants => Will not change!
// Inject in controllers/services etc. by adding "ENV" to the list of dependencies.
.constant('ENV', {
    exampleConstant: 'exampleConstantValue'
})
// Inject in controllers/services etc. by adding "appSettings" to the list of dependencies.
.value('SETTINGS', {
    exampleValue: 'exampleValueValue'
});
