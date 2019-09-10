define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'resources.media.model', 'resources.media-options.helper', 'mask', 'toastr', 'toolbar', 'statusbar', 'pdatepicker', 'tree.helper', 'select2', 'shared.model', 'bootstrap-table', 'bootpag'
], function ($, _, Backbone, Template, Config, Global, MediaModel, MediaOptionsHelper, Mask, toastr, Toolbar, Statusbar, pDatepicker, Tree, select2, SharedModel) {
    var MediaView = Backbone.View.extend({
//        el: $(Config.positions.wrapper),
        model: 'MediaModel'
        , toolbar: [
            {'button': {cssClass: 'btn btn-success', text: '', type: 'submit', task: 'load_metadata', alt: 'جستجو', icon: 'fa fa-search'}}
            , {'input': {cssClass: 'form-control', placeholder: 'جستجو', type: 'text', name: 'q', value: "", text: "جستجو", addon: true, icon: 'fa fa-search', style: 'max-width: 120px;'}}
            , {'button': {cssClass: 'btn btn-warning', text: '', type: 'button', task: 'show_tree', alt: 'نمایش برنامه‌ها', icon: 'fa fa-sitemap', style: 'margin-left: 20px; margin-right: 0;'}}
            , {'input': {cssClass: 'form-control', disabled: true, placeholder: 'برنامه', type: 'text', name: 'cat-name', value: "", text: "برنامه", addon: true, icon: 'fa fa-sitemap', style: 'max-width: 120px;'}}
            , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'enddate', addon: true, icon: 'fa fa-calendar',
                //persianDate().format('YYYY-MM-DD')
                    value: Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD')), style: 'max-width: 100px;'}}
            // moment().subtract(7, 'day').format('YYYY-MM-DD')
            , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'startdate', addon: true, icon: 'fa fa-calendar',
                    value: Global.jalaliToGregorian(persianDate(SERVERDATE).subtract('month', 1).format('YYYY-MM-DD')), style: 'max-width: 100px;'}}
            , {'select': {cssClass: 'form-control', name: 'change-mode', options: [{value: 'latest', text: 'آخرین‌ها'}, {value: 'tree', text: 'انتخابی'}], addon: true, icon: 'fa fa-list'}}
//            , {'select': {cssClass: 'form-control', name: 'date-mode', options: [{value: 'production', text: 'تاریخ تولید'}, {value: 'broadcast', text: 'تاریخ پخش'}], addon: true, icon: 'fa fa-list'}}
//             , {'button': {cssClass: 'btn btn-info pull-right', text: '', type: 'button', task: 'toggle-advance', alt: 'جستجوی پیشرفته', icon: 'fa fa-search-plus'}}
            , {'button': {cssClass: 'btn btn-default pull-right', text: '', type: 'button', task: 'print', icon: 'fa fa-print', style: 'margin-left: 10px;'}}
            , {'button': {cssClass: 'btn purple-studio pull-right', text: '', type: 'button', task: 'refresh', icon: 'fa fa-refresh'}}
        ]
        , statusbar: []
        , defaultListLimit: Config.defalutMediaListLimit
        , flags: {}
        , cache: {
            currentCategory: ''
        }
        , mode: 'latest'
        , events: {
            'click [data-task=load_metadata]': 'load'
            , 'click #metadata-page tbody tr': 'selectRow'
            , 'click [data-task=print]': 'print'
            , 'click [data-task=refresh]': 'reLoad'
            , 'click [data-task=show_tree]': 'showTree'
            , 'click [data-task=refresh-view]': 'reLoad'
            , 'click [data-task=toggle-advance]': 'toggleAdvancedSearch'
            , 'change [data-type=change-mode]': 'changeMode'
            , 'click #tree .jstree-anchor': 'loadCategory'
            , 'click .media-options a': 'UpdateMediaParams'
        }
        , toggleAdvancedSearch: function(e) {
            e.preventDefault();
            var $form = $('.advanced-search');
            $form.hasClass('hidden') ? $form.removeClass('hidden') : $form.addClass('hidden');
            if (!$form.find('form:first').length) {
                this.loadSharedParams(function(params) {
                    var template = Template.template.load('resources/media', 'advanced-search.partial');
                    var $container = $('#sub-toolbar .portlet-body');
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(params);
                        $container.html(output).promise().done(function () {
                            window.setTimeout(function () {
                                $("select.select2").each(function () {
                                    if ($(this).hasClass("select2-hidden-accessible"))
                                        $(this).select2('destroy');
                                    $(this).select2({dir: "rtl", multiple: true, tags: true, width: '100%', placeholder: $(this).parent().parent().find('label').text(), dropdownParent: $(this).parents('form:first')});
                                });
                            }, 500);
                        });
                    });
                });
            }
        }
        , loadSharedParams: function (callback) {
            var params = {tags: [], subjects: [], persons: []};
            new SharedModel().fetch({
                success: function (tags) {
                    params.tags = tags.toJSON();
                    new SharedModel({overrideUrl: 'share/persons'}).fetch({
                        success: function (persons) {
                            params.persons = persons.toJSON();
                            new SharedModel({overrideUrl: 'share/subjects'}).fetch({
                                success: function (subjects) {
                                    params.subjects = subjects.toJSON();
                                    if (typeof callback === "function")
                                        callback(params);
                                }
                            });
                        }
                    });
                }
            });
        }
        , UpdateMediaParams: function(e) {
            e.preventDefault();
            var self = this;
            var $li = $(e.target).parents('li:first');
            var params = {task: $li.data('task'), value: $li.data('value'), id: $(e.target).parents('tr:first').data('id')};
            MediaOptionsHelper.update(params, function(response) {
                if (response.error !== false)
                    toastr.error(response.error, 'خطا', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                else {
                    toastr.success('عملیات با موفقیت انجام شد', 'تغییر وضعیت', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                    self.reLoad();
                }
            });
        }
        , print: function (e) {
            e.preventDefault();
            var params = this.getParams();
            params.stateText = $('[data-type="state"]').find('option:selected').text();
            params.typeText = $('[data-type="type"]').find('option:selected').text();
            params.categoryText = $('[data-type="change-mode"]').val() === 'latest' ? 'همه' : $('[name="cat-name"]').val();
            var win = window.open('/resources/mediaprint/?' + $.param(params), '_blank');
            win.focus();
        }
        , showTree: function () {
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
            $('[name="cat-name"]').val($(e.target).text());
            this.mode === "tree" && this.loadItems();
        }
        , selectRow: function (e) {
            if ($(e.target).is('.media-options') || $(e.target).parents('.media-options').length)
                return true;
            var $el = $(e.currentTarget);
            var id = $el.attr("data-id");
            window.open('/resources/mediaitem/' + id);
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
        , getParams: function (skipQueries) {
            var self = this;
            var mode = $("[data-type=change-mode]").val();
            var state = Global.getQuery('state') ? Global.getQuery('state') : $("[name=state]").val();
            var startDate = Global.getQuery('startdate') ? Global.getQuery('startdate') : Global.jalaliToGregorian($("[name=startdate]").val());
            var catid = Global.getQuery('catid') ? Global.getQuery('catid') : '';
            if (catid !== '')
                this.cache.currentCategory = catid;

            if (typeof skipQueries !== 'undefined' && skipQueries)
                state = $("[name=state]").val();
            if (mode === 'tree')
                catid = typeof self.cache.currentCategory !== "undefined" ? self.cache.currentCategory : $('#tree li[aria-selected="true"]').attr("id");
            var params = {
                q: $.trim($("[name=q]").val()),
                type: $("[name=type]").val(),
                offset: 0,
                count: self.defaultListLimit,
                categoryId: catid,
                state: state,
                startdate: startDate + 'T00:00:00',
                enddate: Global.jalaliToGregorian($("[name=enddate]").val()) + 'T23:59:59'
            };
            return params;
        }
        , render: function (params) {
            this.renderToolbar();
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

            // set date from url query
            if (Global.getQuery('startdate')) {
                $('[name="startdate"]').val(persianDate(new Date(Global.getQuery('startdate'))).format('YYYY-MM-DD'));
            }

            var data = $.param(params);
            var model = new MediaModel(params);
            model.fetch({
                data: data
                , success: function (items) {
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
            params.method === "ready" && $('[name="cat-name"]').val(params.text) && self.loadItems();
        }
        , afterRender: function (items, requestParams) {
//            var overrideConfig = {search: false, showPaginationSwitch: false, pageSize: 25};
//            $("#metadata-page table").bootstrapTable($.extend({}, Config.settings.bootstrapTable, overrideConfig));
            $('[data-type="total-count"]').html(items.count);
            $('[data-type="total-duration"]').html(Global.createTime2(items.duration));

            // set category name from url query
            if (Global.getQuery('catid') && ~~this.cache.currentCategory === ~~Global.getQuery('catid')) {
                if (items.items.length) {
                    var catTitle = items.items[0]['MetaCategoryName'];
                    $('[name="cat-name"]').val(catTitle);
                }
            }

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
            var toolbar = new Toolbar();
            var definedTypes = toolbar.getDefinedToolbar(47, 'type');
            var definedStates = toolbar.getDefinedToolbar(2, 'state');
            var elements = $.merge($.merge($.merge([], self.toolbar), definedTypes), definedStates);
            $.each(elements, function () {
                var method = Object.getOwnPropertyNames(this);
                toolbar[method](this[method]);
            });
            toolbar.render(function () {
                self.afterRenderToolbar();
                $(document).off('change', "#toolbar select[data-type=type]");
                $(document).on('change', "#toolbar select[data-type=type]", function () {
                    self.loadItems();
                });
            });
        }
        , afterRenderToolbar: function () {
            if (Global.getQuery('state'))
                $('[data-type="state"]').val(Global.getQuery('state'));
            var $datePickers = $(".datepicker");
            var datepickerConf = {
                onSelect: function () {
                    self.load();
                    $datePickers.blur();
                }
            };
            $.each($datePickers, function () {
                $(this).pDatepicker($.extend({}, CONFIG.settings.datepicker, datepickerConf));
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

        }
        , prepareSave: function () {
            data = null;
            return data;
        }
    });
    return MediaView;
});