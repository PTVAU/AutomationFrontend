define(['jquery', 'underscore', 'backbone', 'config', 'global', 'moment-with-locales', 'mask', 'jdate', 'mousetrap', 'hotkeys', 'toastr'
], function ($, _, Backbone, Config, Global, moment, Mask, jDate, Mousetrap, Hotkeys, toastr) {
    var ReviewHelper = {
        flags: {}
        , init: function (reinit) {
            if (typeof reinit !== "undefined" && reinit === true) {

            } else {

            }
        }
        , mask: function (type) {
            if (typeof type === "undefined")
                return false;
            switch (type) {
                case 'time':
//                    $("input.time").unmask();
                    $("input.time").mask('H0:M0:S0', {
                        placeholder: '00:00:00', translation: {'H': {pattern: /[0-2]/}, 'M': {pattern: /[0-5]/}, 'S': {pattern: /[0-5]/}}
                    });
                    break;
            }
        }
        , validate: function () {
            this.beforeSave = function () {
                // return false if found error in page or return true
                return true;
            };
        }
    };
    return ReviewHelper;
});