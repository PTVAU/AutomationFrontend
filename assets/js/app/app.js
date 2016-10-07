define([
    "jquery"
    , "underscore"
    , "backbone"
    , "router"
], function ($, _, Backbone, Router) {
    var initialize = function () {
        // Setting Global Variables
        (function () {
            window.STORAGE = localStorage;
            window.SESSION = sessionStorage;
        })();
    };

    return {
        initialize: initialize
    };
});