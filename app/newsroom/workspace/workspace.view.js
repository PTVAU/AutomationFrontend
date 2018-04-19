define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'user', 'toolbar', 'statusbar', 'pdatepicker', 'select2', 'newsroom.model', 'users.manage.model', 'hotkeys', 'toastr', 'bootbox', 'bootpag', 'bootstrap/tab', 'bootstrap/modal', 'bootstrap/tooltip'
], function ($, _, Backbone, Template, Config, Global, User, Toolbar, Statusbar, pDatepicker, select2, NewsroomModel, UsersManageModel, Hotkeys, toastr, bootbox) {
    var NewsroomWorkspaceView = Backbone.View.extend({
        data: {}
        , itamContainer: ".item.box .mainbody"
        , events: {
            'click [data-task="load"]': 'reLoad'
            , 'click button[data-task="refresh"]': 'reLoad'
            , 'click button[data-task="open-send-modal"]': 'toggleSendModal'
            , 'click button[data-task="delete-batch"]': 'deleteBatch'
            , 'click button[data-task="delete"]': 'deleteItem'
            , 'click button[data-task="archive"]': 'archiveItem'
            , 'click button[data-task="merge"]': 'mergeItems'
            , 'click button[data-task="duplicate"]': 'duplicateItme'
            , 'click button[data-task="print"]': 'printItem'
            , 'click button[data-task="new"]': 'createItem'
            , 'click button[data-task="save"]': 'saveItem'
            , 'click #news-items tr[data-id]': 'loadItem'
            , 'change select[data-type="mode"]': 'reLoad'
        }
        , toolbar: [
            {'button': {cssClass: 'btn btn-success pull-right', text: 'جدید', type: 'button', task: 'new', icon: 'fa fa-plus'}}
//            , {'button': {cssClass: 'btn blue pull-right', text: 'ثبت (F4)', type: 'button', task: 'save', icon: 'fa fa-save'}}
            , {'button': {cssClass: 'btn blue pull-right', text: 'ارسال', type: 'button', task: 'open-send-modal', icon: 'fa fa-share'}}
//            , {'button': {cssClass: 'btn red pull-right', text: 'حذف', type: 'button', task: 'delete-batch', icon: 'fa fa-trash'}}
            , {'button': {cssClass: 'btn purple-medium pull-right', text: 'ادغام', type: 'button', task: 'merge', icon: 'fa fa-tasks'}}
            , {'button': {cssClass: 'btn yellow-gold pull-right', text: 'کپی', type: 'button', task: 'duplicate', icon: 'fa fa-clone'}}
            , {'button': {cssClass: 'btn btn-default pull-right', text: 'پرینت', type: 'button', task: 'print', icon: 'fa fa-print'}}
            , {'button': {cssClass: 'btn purple-studio pull-right', text: '', type: 'button', task: 'refresh', icon: 'fa fa-refresh'}}
            , {'button': {cssClass: 'btn btn-success', text: 'نمایش', type: 'button', task: 'load'}}
            , {'input': {cssClass: 'form-control', placeholder: 'جستجو', type: 'text', name: 'q', addon: true, icon: 'fa fa-search'}}
//            , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'enddate', addon: true, icon: 'fa fa-calendar'
//                    , value: Global.getVar("enddate") ? Global.jalaliToGregorian(Global.getVar("date")) : Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD'))
//                }
//            }
//            , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'startdate', addon: true, icon: 'fa fa-calendar'
//                    , value: Global.getVar("startdate") ? Global.jalaliToGregorian(Global.getVar("date")) : Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD'))
//                }
//            }
        ]
        , statusbar: [
//            {type: 'total-count', text: 'تعداد آیتم‌ها ', cssClass: 'badge badge-info'}
        ]
        , defaultParams: {
//            keyword: null
//            , topic: null
//            , source: null
//            , q: ''
            mode: 1
            , offset: 0
            , count: 50
//            , startdate: Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD')) + 'T00:00:00'
//            , enddate: Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD')) + 'T23:59:59'
        }
        , render: function () {
            this.loadItems();
            this.renderStatusbar();
            this.fillSelects();
            this.attachDatepickers();
            this.initHotKeys();
            return this;
        }
        , reLoad: function (e) {
            e.preventDefault();
            this.loadItems({});
        }
        , initHotKeys: function () {
            var self = this;
            $.hotkeys.options.filterInputAcceptingElements = false;
            $.hotkeys.options.filterTextInputs = false;
            $(document).off('keydown', null);
            $(document).on('keydown', null, 'down', function (e) {
                var activeRow = $("#news-items tbody").find("tr.active");
                if (!$('input:focus, textarea:focus, button:focus, select:focus').length) {
                    if (activeRow.find("+ tr").length) {
                        if (typeof self.data.itemIsLoading !== "undefined" && self.data.itemIsLoading !== true)
                            activeRow.removeClass('active info').trigger('deactivated').next('tr').addClass('active info').trigger('activated').trigger('click');
                    }
                }
            });
            $(document).on('keydown', null, 'up', function (e) {
                var activeRow = $("#news-items tbody").find("tr.active");
                if (!$('input:focus, textarea:focus, button:focus, select:focus').length) {
                    if (activeRow.prev('tr').length) {
                        if (typeof self.data.itemIsLoading !== "undefined" && self.data.itemIsLoading !== true)
                            activeRow.removeClass('active info').trigger('deactivated').prev('tr').addClass('active info').trigger('activated').trigger('click');
                    }
                }
            });
            $(document).on('keydown', null, 'f2', function () {
                self.sendDraft();
            });
            $(document).on('keydown', null, 'f5', function () {
                self.loadItems(null, true);
                return false;
            });
            $(document).on('keydown', null, 'f4', function () {
                self.saveItem();
                return false;
            });
        }
        , toggleSendModal: function (e) {
            e.preventDefault();
            $("#send-item-modal").modal('toggle');
        }
        , updateCurrentRowTitle: function (id, title) {
            $("#news-items tr[data-id=" + id + "]").find('[data-type="headline"] strong').text(title);
        }
        , getItemId: function ($el) {
            if ($el.is('[data-id]') || $el.parent('[data-id]').length) {
                return $el.is('[data-id]') ? $el.data('id') : $el.parent().data('id');
            } else {
                return null;
            }
        }
        , updateItem: function (params, data, message, callback) {
            new NewsroomModel(params).save(data, {
                patch: true
                , error: function (e, data) {
                    toastr.error(data.responseJSON.Message, 'خطا', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                }
                , success: function (model, response) {
                    toastr.success('عملیات با موفقیت انجام شد', message, {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                    if (typeof callback === "function")
                        callback();
                }
            });
        }
        , archiveItem: function (e) {
            var self = this;
            var id = this.getItemId($(e.target)) ? this.getItemId($(e.target)) : this.getId();
            if (typeof id === "undefined" || id === "")
                return false;
            bootbox.confirm({
                message: "مورد آرشیو خواهد شد. آیا مطمئن هستید؟"
                , buttons: {
                    confirm: {className: 'btn-success'}
                    , cancel: {className: 'btn-danger'}
                }
                , callback: function (results) {
                    if (results) {
                        var params = {id: id, overrideUrl: 'nws'};
                        var data = [{'key': 'kind', value: 1}];
                        self.updateItem(params, data, 'آرشیو', function () {
                            $("#news-items tr[data-id=" + id + "]").remove();
                        });
                    }
                }
            });
        }
        , deleteItem: function (e) {
            var self = this;
            var id = this.getItemId($(e.target)) ? this.getItemId($(e.target)) : this.getId();
            if (typeof id === "undefined" || id === "")
                return false;
            bootbox.confirm({
                message: "مورد حذف خواهد شد. آیا مطمئن هستید؟"
                , buttons: {
                    confirm: {className: 'btn-success'}
                    , cancel: {className: 'btn-danger'}
                }
                , callback: function (results) {
                    if (results) {
                        var params = {id: id, overrideUrl: 'nws'};
                        var data = [{'key': 'kind', value: -1}];
                        self.updateItem(params, data, 'حذف آیتم', function () {
                            $("#news-items tr[data-id=" + id + "]").remove();
                        });
                    }
                }
            });
        }
        , deleteBatch: function () {

        }
        , saveItem: function () {
            var self = this;
            var id = this.getId();
            if (typeof id === "undefined" || id === "")
                return false;
            var params = [
                {'key': 'headline', value: $('[name="headline"]').val()}
                , {'key': 'body', value: $('[name="body"]').val()}
            ];
            new NewsroomModel({id: self.getId(), overrideUrl: 'nws'}).save(params, {
                patch: true
                , error: function (e, data) {
                    toastr.error(data.responseJSON.Message, 'خطا', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                }
                , success: function (model, response) {
                    toastr.success('عملیات با موفقیت انجام شد', 'ثبت اطلاعات', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                    self.updateCurrentRowTitle(self.getId(), $('[name="headline"]').val());
                }
            });
        }
        , loadItems: function (overridePrams, skipClickTrigger) {
            var self = this;
            var overridePrams = typeof overridePrams === "object" ? overridePrams : {};
            var params = self.getToolbarParams();
            var requestParams = $.extend({}, self.defaultParams, params, overridePrams);
            var model = new NewsroomModel({query: $.param(requestParams), overrideUrl: 'nws'});
            var template = Template.template.load('newsroom/workspace', 'workspace');
            model.fetch({
                success: function (items) {
                    items = self.prepareItems(items.toJSON(), $.extend({}, params, {path: 'list'}));
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(items);
                        $(Config.positions.main).html(output).promise().done(function () {
                            self.activateFirstItem();
                            self.afterRender(items, requestParams);
//                            self.loadUsersList();
                        });
                    });
                }
            });
        }
        , loadItem: function (e) {
            var self = this;
            if ($(e.target).is('input') || $(e.target).is('label') || $(e.target).is('.btn') || $(e.target).parents('.btn').length)
                return true;
            if (typeof self.data.itemIsLoading !== "undefined" && self.data.itemIsLoading !== false)
                return false;
            if ($(e.target).is("a") || $(e.target).parents("a").length)
                return true;
            var $row = $(e.target).is("tr") ? $(e.target) : $(e.target).parents("tr:first");
            $row.parent().find(".active").removeClass('active info') && $row.addClass('active info');
            var params = {id: $row.data("id"), overrideUrl: 'nws'};
            var model = new NewsroomModel(params);
            var template = Template.template.load('newsroom/workspace', 'workspace-item.partial');
            self.data['itemIsLoading'] = true;
            model.fetch({
                success: function (item) {
                    item = self.prepareItems(item.toJSON(), params);
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(item);
                        $(self.itamContainer).html(output).promise().done(function () {
                            self.data['currentItem'] = $row.data("id");
                            self.data['itemIsLoading'] = false;
                            self.loadMetadata(item.sourceId);
                        });
                    });
                }
            });
        }
        , loadMetadata: function(id) {
            var self = this;
            var params = {query: $.param({id: id}), path: 'item'};
            var model = new NewsroomModel(params);
            var template = Template.template.load('newsroom/workspace', 'metadata.partial');
            model.fetch({
                success: function (item) {
                    item = self.prepareItems(item.toJSON(), params);
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(item);
                        $("#metadata-tabs").html(output).promise().done(function () {
                        });
                    });
                }
            });
        }
        , getId: function () {
            return $("#news-items tr.active").data('id');
        }
        , activateFirstItem: function () {
            $(".box.itemlist table tbody tr:first").trigger('click');
        }
        , getToolbarParams: function () {
            return {
                mode: $('[name="mode"]').val()
                , q: $('[name="q"]').val()
            };
        }
        , afterRender: function (items, requestParams) {
            this.handleDashboardHeight();
            this.handleStatusbar(items);
            this.renderPagination(items, requestParams);
            $('[data-type="total-count"]').html(items.count);
            $('[data-toggle="tooltip"]').tooltip();
            this.handleDifferCount(items, requestParams);
        }
        , loadUsersList: function () {
            new UsersManageModel({}).fetch({
                success: function (items) {
                    var items = items.toJSON();
                    $.each(items, function () {
                        $("[name=ToUserId]").append('<option value="' + this.Id + '">' + this.Name + ' ' + this.Family + '</option>');
                    });
                }
            });
        }
        , handleDifferCount: function (items, requestParams) {
            var self = this;
//            if (typeof this.data.differInterval !== "undefined") {
//                window.clearInterval(this.data.differInterval);
//                $(".blink").fadeOut();
//            }
            Backbone.history.on("all", function (route, router) {
                if (typeof self.data.differInterval !== "undefined") {
                    window.clearInterval(self.data.differInterval);
//                    $(".blink").fadeOut();
                }
            });
//            this.data.differInterval = window.setInterval(function () {
//                $.ajax({
//                    url: Config.api.url + Config.api.newsroom + '/list/livecount'
//                    , data: $.param(requestParams)
//                    , global: false
//                    , success: function (data) {
//                        if (data > items.count) {
//                            $(".blink span").html(data - items.count);
//                            $(".blink").fadeOut().fadeIn();
//                        }
//                    }
//                });
//            }, 5000);
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
        , handleDashboardHeight: function () {
            var self = this;
            window.setTimeout(function () {
                self.processDashboardHeight();
            }, 500);
            $(window).on('resize', function () {
                self.processDashboardHeight();
            });
        }
        , processDashboardHeight: function () {
            var height = $(window).outerHeight() - $(".page-header").outerHeight() - $(".page-footer").outerHeight() - $(".toolbar-box").outerHeight() - 45;
            $(".news-dashboard").height(height);
        }
        , fillSelects: function () {
            var self = this;
            $('select.lazy[data-type]').each(function () {
                var params = {path: 'st', query: 'type=' + ($(this).data("type") === "source" ? 1 : 2)};
                var $select = $(this);
                new NewsroomModel(params).fetch({
                    success: function (items) {
                        $select.select2({data: self.prepareList(self.prepareItems(items.toJSON(), params)), dir: "rtl", multiple: true, width: 160, tags: false, placeholder: $select.attr('placeholder')});
                    }
                });
            });
            $('select.suggest[data-type]').each(function () {
                $(this).select2({dir: "rtl", multiple: true, width: 180, tags: false, placeholder: $(this).attr('placeholder'), ajax: {
                        delay: 250, url: Config.api.url + Config.api.newsroom + '/keywords'
                    }
                });
            });
        }
        , renderToolbar: function () {
            var self = this;
            var elements = self.toolbar;
            var toolbar = new Toolbar();
            var definedModes = toolbar.getDefinedToolbar(86, 'mode');
            var elements = $.merge($.merge([], self.toolbar), definedModes);
            $.each(elements, function () {
                var method = Object.getOwnPropertyNames(this);
                toolbar[method](this[method]);
            });
            toolbar.render();
        }
        , renderStatusbar: function () {
            var elements = this.statusbar;
            var statusbar = new Statusbar();
            $.each(elements, function () {
                statusbar.addItem(this);
            });
            statusbar.render();
        }
        , handleStatusbar: function (items) {
        }
        , prepareContent: function () {
            this.renderToolbar();
        }
        , attachDatepickers: function () {
            var self = this;
            var $datePickers = $(".datepicker");
            $.each($datePickers, function () {
                var $this = $(this);
                if ($this.data('datepicker') == undefined) {
                    $this.pDatepicker($.extend({}, CONFIG.settings.datepicker, {
                        onSelect: function () {
                            if ($this.parents("#toolbar").length) {
//                                self.load();
//                                $('.datepicker.source').val($this.val());
                            }
                            $datePickers.blur();
                        }
                    }));
                }
            });
        }
        , prepareList: function (items) {
            return $.map(items, function (obj) {
                obj.text = obj.title;
                return obj;
            });
        }
        , prepareItems: function (items, params) {
            if (typeof items.query !== "undefined")
                delete items.query;
            if (typeof params !== "undefined")
                for (var prop in params)
                    delete items[prop];
            return items;
        }
    });

    return NewsroomWorkspaceView;
});
