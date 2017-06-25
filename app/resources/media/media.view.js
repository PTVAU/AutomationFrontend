define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'resources.media.model', 'mask', 'toastr', 'toolbar', 'statusbar', 'pdatepicker', 'bootstrap-table'
], function ($, _, Backbone, Template, Config, Global, MediaModel, Mask, toastr, Toolbar, Statusbar, pDatepicker) {
    var MediaView = Backbone.View.extend({
//        el: $(Config.positions.wrapper),
        model: 'MediaModel'
        , toolbar: [
            {'button': {cssClass: 'btn btn-success', text: 'جستجو', type: 'submit', task: 'load_metadata'}}
            , {'input': {cssClass: 'form-control', placeholder: 'جستجو', type: 'text', name: 'q', value: "", text: "جستجو", addon: true, icon: 'fa fa-search'}}
            , {'button': {cssClass: 'btn purple-studio pull-right', text: '', type: 'button', task: 'refresh', icon: 'fa fa-refresh'}}
        ]
        , statusbar: []
        , flags: {}
        , events: {
            'click [data-task=load_metadata]': 'load'
            , 'click #metadata-page tbody tr': 'selectRow'
            , 'click [data-task=refresh]': 'reLoad'
            , 'click [data-task=refresh-view]': 'reLoad'
        }
        , selectRow: function (e) {
            var $el = $(e.currentTarget);
            var id = $el.attr("data-id");
            window.open('/resources/mediaitem/' + id);
            return;
        }
        , reLoad: function (e) {
            if (typeof e !== "undefined")
                e.preventDefault();
            this.load();
        }
        , load: function (e, extend) {
            if (typeof e !== "undefined")
                e.preventDefault();
            console.info('Loading items');
            var params = {
                q: $.trim($("[name=q]").val())
                , type: $("[name=type]").val()
            };
            params = (typeof extend === "object") ? $.extend({}, params, extend) : params;
            this.render(params);
            return false;
        }
        , render: function (params) {
            var self = this;
            var template = Template.template.load('resources/media', 'media');
            var $container = $(Config.positions.main);
            var params = (typeof params !== "undefined") ? params : {q: '', type: -1};
            var model = new MediaModel(params);
            var self = this;
            var data = typeof params !== "undefined" ? $.param({q: params.q}) : null;
            model.fetch({
                data: data
                , success: function (items) {
                    items = self.prepareItems(items.toJSON(), params);
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(items);
                        $container.html(output).promise().done(function () {
                            self.afterRender();
                        });
                    });
                }
            });
        }
        , afterRender: function () {
            var overrideConfig = {search: false, showPaginationSwitch: false, pageSize: 25};
            $("#metadata-page table").bootstrapTable($.extend({}, Config.settings.bootstrapTable, overrideConfig));
            this.renderStatusbar();
        }
        , renderToolbar: function () {
            var self = this;
//            var elements = this.toolbar;
            var toolbar = new Toolbar();
            var definedItems = toolbar.getDefinedToolbar(47, 'type');
            console.log(definedItems)
            var elements = $.merge($.merge([], self.toolbar), definedItems);
            $.each(elements, function () {
                var method = Object.getOwnPropertyNames(this);
                toolbar[method](this[method]);
            });
            toolbar.render();
            $(document).on('change', "#toolbar select", function () {
                self.load();
            });
        }
        , renderStatusbar: function () {
            var elements = this.statusbar;
            var statusbar = new Statusbar();
            $.each(elements, function () {
                statusbar.addItem(this);
            });
            statusbar.render();
        }
        , prepareItems: function (items, params) {
            if (typeof items.query !== "undefined")
                delete items.query;
            if (typeof params !== "undefined") {
                for (var prop in params) {
                    delete items[prop];
                }
            }
            return items;
        }
        , prepareContent: function () {
            this.renderToolbar();
        }
        , prepareSave: function () {
            data = null;
            return data;
        }
    });
    return MediaView;
});