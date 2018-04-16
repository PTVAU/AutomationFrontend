define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'user', 'toolbar', 'statusbar', 'pdatepicker', 'select2', 'newsroom.model', 'users.manage.model', 'hotkeys', 'toastr', 'bootpag', 'bootstrap/tab', 'bootstrap/modal'
], function ($, _, Backbone, Template, Config, Global, User, Toolbar, Statusbar, pDatepicker, select2, NewsroomModel, UsersManageModel, Hotkeys, toastr) {
    var NewsroomNewsView = Backbone.View.extend({
        data: {}
        , itamContainer: ".item.box .mainbody"
        , events: {
            'click [data-task="load"]': 'reLoad'
            , 'click button[data-task="refresh"]': 'reLoad'
            , 'click button[data-task="open-send-modal"]': 'toggleSendModal'
            , 'click button[data-task="send-draft"]': 'sendDraft'
            , 'click [data-toggle="ToUserId"]': 'toogleReceipt'
            , 'click tr[data-id]': 'loadItem'
        }
        , toolbar: [
            {'button': {cssClass: 'btn blue pull-right', text: 'ارسال', type: 'button', task: 'open-send-modal', icon: 'fa fa-share'}}
            , {'button': {cssClass: 'btn blue-sharp pull-right', text: 'ذخیره', type: 'button', task: 'send-draft', icon: 'fa fa-save'}}
            , {'button': {cssClass: 'btn purple-studio pull-right', text: '', type: 'button', task: 'refresh', icon: 'fa fa-refresh'}}
            , {'button': {cssClass: 'btn btn-success', text: 'نمایش', type: 'button', task: 'load'}}
            , {'select': {cssClass: 'form-control select2 suggest', placeholder: 'کلیدواژه', name: 'keyword', text: 'کلیدواژه', icon: 'fa fa-tag', multi: true, options: [], addon: true}}
            , {'select': {cssClass: 'form-control select2 lazy', placeholder: 'موضوع', name: 'topic', text: 'موضوع', multi: true, icon: 'fa fa-filter', options: [], addon: true}}
            , {'select': {cssClass: 'form-control select2 lazy', placeholder: 'منبع', name: 'source', text: 'منبع', multi: true, icon: 'fa fa-globe', ptions: [], addon: true}}
            , {'input': {cssClass: 'form-control', placeholder: 'جستجو', type: 'text', name: 'q', addon: true, icon: 'fa fa-search'}}
            , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'enddate', addon: true, icon: 'fa fa-calendar'
                    , value: Global.getVar("enddate") ? Global.jalaliToGregorian(Global.getVar("date")) : Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD'))
                }
            }
            , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'startdate', addon: true, icon: 'fa fa-calendar'
                    , value: Global.getVar("startdate") ? Global.jalaliToGregorian(Global.getVar("date")) : Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD'))
                }
            }
        ]
        , statusbar: [
//            {type: 'total-count', text: 'تعداد آیتم‌ها ', cssClass: 'badge badge-info'}
        ]
        , defaultParams: {
            keyword: null
            , topic: null
            , source: null
            , q: ''
            , offset: 0
            , count: 50
            , startdate: Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD')) + 'T00:00:00'
            , enddate: Global.jalaliToGregorian(persianDate(SERVERDATE).format('YYYY-MM-DD')) + 'T23:59:59'
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
        , sendDraft: function (e) {
            e.preventDefault();
            var self = this;
            var data = {
                cmd: 'clonenews', sourceId: this.data.currentItem, sourceTable: 'news', destTable: 'workspace', destId: 0
            };
            new NewsroomModel({overrideUrl: 'nws'}).save(null, {
                data: JSON.stringify(data)
                , contentType: 'application/json'
                , processData: false
                , success: function () {
                    toastr.success('با موفقیت انجام شد', 'ارسال به پیش‌نویس', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                }
            });
        }
        , initHotKeys: function () {
            $.hotkeys.options.filterInputAcceptingElements = false;
            $.hotkeys.options.filterTextInputs = false;

            $(document).on('keydown', null, 'down', function (e) {
                var activeRow = $("#news-items tbody").find("tr.active");
//                if (activeRow.length && !(activeRow.find('input[data-type="title"], select').is(":focus") || activeRow.find('input[data-type="episode-title"], select').is(":focus")))
                    if (activeRow.find("+ tr").length) {
                        activeRow.removeClass('active info').trigger('deactivated').next('tr').addClass('active info').trigger('activated').trigger('click');
                    }
            });
            $(document).on('keydown', null, 'up', function (e) {
                var activeRow = $("#news-items tbody").find("tr.active");
//                if (activeRow.length && !(activeRow.find('input[data-type="title"], select').is(":focus") || activeRow.find('input[data-type="episode-title"], select').is(":focus"))) {
                    if (activeRow.prev('tr').length) {
                        activeRow.removeClass('active info').trigger('deactivated').prev('tr').addClass('active info').trigger('activated').trigger('click');
                    }
//                }
            });
        }
        , toogleReceipt: function (e) {
            $('[name=ToUserId]').prop('disabled', function (index, prop) {
                return prop == true ? false : true;
            });
        }
        , toggleSendModal: function (e) {
            e.preventDefault();
            $("#send-item-modal").modal('toggle');
        }
        , loadItems: function (overridePrams) {
            var self = this;
            var overridePrams = typeof overridePrams === "object" ? overridePrams : {};
            var params = self.getToolbarParams();
            var requestParams = $.extend({}, self.defaultParams, params, overridePrams);
            var model = new NewsroomModel({query: $.param(requestParams), path: 'list'});
            var template = Template.template.load('newsroom/news', 'news');
            model.fetch({
                success: function (items) {
                    items = self.prepareItems(items.toJSON(), $.extend({}, params, {path: 'list'}));
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(items);
                        $(Config.positions.main).html(output).promise().done(function () {
                            self.activateFirstItem();
                            self.afterRender(items, requestParams);
                        });
                    });
                }
            });
        }
        , loadItem: function (e) {
            var self = this;
            if ($(e.target).is("a") || $(e.target).parents("a").length)
                return true;
            var $row = $(e.target).is("tr") ? $(e.target) : $(e.target).parents("tr:first");
            $row.parent().find(".active").removeClass('active info') && $row.addClass('active info');
            var params = {query: $.param({id: $row.data("id")}), path: 'item'};
            var model = new NewsroomModel(params);
            var template = Template.template.load('newsroom/item', 'item.partial');
            model.fetch({
                success: function (item) {
                    item = self.prepareItems(item.toJSON(), params);
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(item);
                        $(self.itamContainer).html(output).promise().done(function () {
                            self.data['currentItem'] = $row.data("id");
                            self.loadUsersList();
                        });
                    });
                }
            });
            e.preventDefault();
        }
        , activateFirstItem: function () {
            $(".box.itemlist table tbody tr:first").trigger('click');
        }
        , getToolbarParams: function () {
            return {
                keyword: $('[data-type="keyword"]').val().join(',')
                , topic: $('[data-type="topic"]').val().join(',')
                , source: $('[data-type="source"]').val().join(',')
                , q: $('[name="q"]').val()
                , startdate: Global.jalaliToGregorian($('[name="startdate"]').val()) + 'T00:00:00'
                , enddate: Global.jalaliToGregorian($('[name="enddate"]').val()) + 'T23:59:59'
            };
        }
        , afterRender: function (items, requestParams) {
            this.handleDashboardHeight();
            this.handleStatusbar(items);
            this.renderPagination(items, requestParams);
            $('[data-type="total-count"]').html(items.count);
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
            if (typeof this.data.differInterval !== "undefined") {
                window.clearInterval(this.data.differInterval);
                $(".blink").fadeOut();
            }
            Backbone.history.on("all", function (route, router) {
                if (typeof self.data.differInterval !== "undefined") {
                    window.clearInterval(self.data.differInterval);
//                    $(".blink").fadeOut();
                }
            });
            this.data.differInterval = window.setInterval(function () {
                $.ajax({
                    url: Config.api.url + Config.api.newsroom + '/list/livecount'
                    , data: $.param(requestParams)
                    , global: false
                    , success: function (data) {
                        if (data > items.count) {
                            $(".blink span").html(data - items.count);
                            $(".blink").fadeOut().fadeIn();
                        }
                    }
                });
            }, 5000);
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

    return NewsroomNewsView;

});
