define(["jquery", "underscore", "backbone", "config"
], function ($, _, Backbone, Config) {
    var SharedModel = Backbone.Model.extend({
        defaults: {}
        , initialize: function (options) {
            this.query = (options && options.query) ? '?' + options.query : '';
            this.path = (options && options.path) ? options.path : '';
            this.path = (options && options.id) ? '/' + options.id : this.path;
            this.overrideUrl = (options && options.overrideUrl) ? options.overrideUrl : '';
            options = {};
        }
        , url: function () {
            if (this.overrideUrl !== "")
                return this.overrideUrl + this.path + this.query;
            else
                return Config.api.tags + this.path + this.query;
        }
        , navigate: function (data) {
//            var win = window.open(Config.api.url + Config.api.storagefiles + '?' + data, '_blank');
//            win && win.focus();
        }
        , save: function (key, val, options) {
            return Backbone.Model.prototype.save.call(this, key, val, options);
        }
    });
    return SharedModel;
});
