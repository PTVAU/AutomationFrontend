define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'resources.media.model', 'mask', 'toastr', 'toolbar', 'statusbar', 'pdatepicker', 'tree.helper', 'bootstrap-table', 'bootpag'
], function ($, _, Backbone, Template, Config, Global, MediaModel, Mask, toastr, Toolbar, Statusbar, pDatepicker, Tree) {
    var MediaView = Backbone.View.extend({
//        el: $(Config.positions.wrapper),
        model: 'MediaModel'
        , toolbar: [
            {'button': {cssClass: 'btn btn-warning', text: 'نمایش برنامه‌ها', type: 'button', task: 'show_tree', icon: 'fa fa-sitemap'}}
            , {'button': {cssClass: 'btn btn-success', text: 'جستجو', type: 'submit', task: 'load_metadata'}}
            , {'input': {cssClass: 'form-control', placeholder: 'جستجو', type: 'text', name: 'q', value: "", text: "جستجو", addon: true, icon: 'fa fa-search'}}
            , {'select': {cssClass: 'form-control', name: 'change-mode', options: [{value: 'latest', text: 'آخرین‌ها'}, {value: 'tree', text: 'انتخابی'}], addon: true, icon: 'fa fa-list'}}
            , {'button': {cssClass: 'btn purple-studio pull-right', text: '', type: 'button', task: 'refresh', icon: 'fa fa-refresh'}}
        ]
        , statusbar: []
        , defaultListLimit: Config.defalutMediaListLimit
        , flags: {}
        , cache: {
        }
        , mode: 'latest'
        , events: {
            'click [data-task=load_metadata]': 'load'
            , 'click #metadata-page tbody tr': 'selectRow'
            , 'click [data-task=refresh]': 'reLoad'
            , 'click [data-task=show_tree]': 'showTree'
            , 'click [data-task=refresh-view]': 'reLoad'
            , 'change [data-type=change-mode]': 'changeMode'
            , 'click #tree .jstree-anchor': 'loadCategory'
        }
        , showTree: function() {
            if ($("#media-list").hasClass('tree-open')) {
                $("#tree").fadeOut(300);
                $("#itemlist").animate({
                    'margin-right': 0
                });
                $("#media-list").removeClass('tree-open');
            } else {
                $("#tree").fadeIn(300);
                $("#itemlist").animate({
                    'margin-right': '25%'
                });
                $("#media-list").addClass('tree-open');
            }
        }
        , loadCategory: function (e) {
            var id = (typeof e === "object") ? $(e.target).parent().attr('id') : e;
            this.cache.currentCategory = parseInt(id);
            this.mode === "tree" && this.loadItems();
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
            var params = this.getParams();
            params = (typeof extend === "object") ? $.extend({}, params, extend) : params;
            this.loadItems(params);
            return false;
        }
        , getParams: function () {
            var self = this;
            var mode = $("[data-type=change-mode]").val();
            switch (mode) {
                case 'tree':
                    var catid = typeof self.cache.currentCategory !== "undefined" ? self.cache.currentCategory : $('#tree li[aria-selected="true"]').attr("id");
                    // TEMP
//                    var params = {q: $.trim($("[name=q]").val()), type: $("[name=type]").val(), categoryId: catid};
                    var params = {categoryId: catid, offset: 0, count: self.defaultListLimit};
                    break;
                default:
                case 'latest':
                    var params = {q: $.trim($("[name=q]").val()), type: $("[name=type]").val(), offset: 0, count: self.defaultListLimit};
                    break;
            }
            return params;
        }
        , render: function (params) {
            var self = this;
            var template = Template.template.load('resources/media', 'media');
            var $container = $(Config.positions.main);
            template.done(function (data) {
                var handlebarsTemplate = Template.handlebars.compile(data);
                var output = handlebarsTemplate({});
                $container.html(output).promise().done(function () {
                    self.loadTree();
                });
            });
            return;
        }
        , loadTree: function () {
            $("#tree").length && new Tree($("#tree"), Config.api.tree, this).render();
        }
        , changeMode: function (e) {
            this.mode = $(e.target).val();
            this.loadItems();
            e.preventDefault();
            return false;
        }
        , loadItems: function (params) {
            var self = this;
            var params = (typeof params !== "undefined") ? params : self.getParams();
            var data = $.param(params);
            var model = new MediaModel(params);
            model.fetch({
                data: data
                , success: function (items) {
//                    items = self.prepareItems(items.toJSON(), params);
                    items = items.toJSON();
                    var template = Template.template.load('resources/media', 'media.items.partial');
                    var $container = $("#itemlist");
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(items);
                        $container.html(output).promise().done(function () {
                            self.afterRender(items, params);
                        });
                    });
                }
            });
        }
        , handleTreeCallbacks: function (params, $tree, node) {
            var self = this;
            self.cache.currentCategory = params.id;
            params.method === "ready" && self.loadItems();
        }
        , afterRender: function (items, requestParams) {
//            var overrideConfig = {search: false, showPaginationSwitch: false, pageSize: 25};
//            $("#metadata-page table").bootstrapTable($.extend({}, Config.settings.bootstrapTable, overrideConfig));
            $('[data-type="total-count"]').html(items.count);
            this.renderPagination(items, requestParams);
            this.renderStatusbar();
        }
        , renderPagination: function (items, requestParams) {
            var self = this;
            $('.paginator').bootpag({
                total: Math.ceil(items.count / requestParams.count),
                page: (requestParams.offset / requestParams.count) + 1,
                maxVisible: 10,
                leaps: true,
                firstLastUse: true,
                first: '→',
                last: '←',
                wrapClass: 'pagination',
                activeClass: 'active',
                disabledClass: 'disabled',
                nextClass: 'next',
                prevClass: 'prev',
                lastClass: 'last',
                firstClass: 'first'
            }).on("page", function (event, num) {
                requestParams.offset = (num - 1) * requestParams.count;
                self.loadItems(requestParams);
            });
        }
        , renderToolbar: function () {
            var self = this;
//            var elements = this.toolbar;
            var toolbar = new Toolbar();
            var definedItems = toolbar.getDefinedToolbar(47, 'type');
            var elements = $.merge($.merge([], self.toolbar), definedItems);
            $.each(elements, function () {
                var method = Object.getOwnPropertyNames(this);
                toolbar[method](this[method]);
            });
            toolbar.render();
            $(document).on('change', "#toolbar select[data-type=type]", function () {
                self.loadItems();
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