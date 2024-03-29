define(['jquery', 'underscore', 'backbone', 'config', 'global', 'x-editable', 'bootstrap/tooltip', 'bootstrap/popover'], function ($, _, Backbone, Config, Global, editable) {
    window.Editable = function (options, callback) {
        this.defaults = {
            rtl: true
            , showbuttons: true
            , el: null
        };
        this.options = $.extend({}, this.defaults, options);
        this.callback = (typeof callback !== "undefined") ? callback : null;
        if (typeof this.options.simple === "undefined" || this.options.simple !== true) {
            if (typeof this.options.service === "undefined" || !this.options.service)
                throw 'No service specified';
        }
    };
    _.extend(Editable.prototype, {
        init: function () {
            var self = this;
            var options = self.options;
            self.setGlobalSettings();
            window.setTimeout(function () {
                var $fields = options.el !== null ? $(options.el).find(".x-editable") : $(".x-editable");
                $fields.each(function () {
                    var $this = $(this);
                    if ($this.parents("[data-editable]").length && $this.parents("[data-editable]").attr('data-editable')) {
                        $this.editable({
                            type: 'text'
                            , name: $this.attr('data-field')
                            , title: $this.attr('data-original-title')
                            , pk: $this.attr('data-pk')
                            , placement: options.rtl ? 'left' : 'right'
                            , rtl: options.rtl
                            , showbuttons: options.showbuttons
                            , emptytext: 'خالی'
                            , validate: function (value) {
                                if ($this.attr('data-optional') !== 'undefined' && $this.attr('data-optional') === 'true') {
                                    return;
                                }
                                if ($.trim(value) === '')
                                    return 'وارد کردن اطلاعات برای این فیلد اجباری است.';
                            }
                        });
                        self.callback !== null && self.setEventListeners($this, options);
                    }
                });
            }, 1000);
        }
        , setGlobalSettings: function () {
            $.fn.editable.defaults.mode = 'inline';
            $.fn.editable.defaults.inputclass = 'form-control';
//            $.fn.editable.defaults.ajaxOptions = {type: "PATCH"};
        }
        , setEventListeners: function ($obj, options) {
            var self = this;
            $obj.on('save', function (e, params) {
                var data = {
                    key: $(e.currentTarget).attr('data-field')
                    , value: params.newValue
                };
                self.callback !== null && self.callback["handleEditables"]($(e.currentTarget).attr('data-pk'), data);
            });
//            $obj.on('init', function (e, edt) {
//                self.callback["handleEditables"]('aaaa');
//                edt.options.url = options.service;
//            });
        }
    });
    return Editable;
});