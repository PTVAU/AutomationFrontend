define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'broadcast.crawl.model', 'toastr', 'toolbar', 'statusbar', 'pdatepicker', 'bootstrap-table'], function ($, _, Backbone, Template, Config, Global, CrawlModel, toastr, Toolbar, Statusbar, pDatepicker) {
    var StatsCrawlView = Backbone.View.extend({
        $modal: "#metadata-form-modal"
        , $metadataPlace: "#metadata-place"
        , model: 'IngestModel'
        , toolbar: [
            {'button': {cssClass: 'btn purple-studio pull-right', text: '', type: 'button', task: 'refresh', icon: 'fa fa-refresh'}}
            , {'button': {cssClass: 'btn btn-success', text: 'نمایش', type: 'button', task: 'show'}}
            // , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'enddate', addon: true, icon: 'fa fa-calendar'}} //persianDate().format('YYYY-MM-DD')
            , {
                'input': {
                    cssClass: 'form-control datepicker',
                    placeholder: '',
                    type: 'text',
                    name: 'startdate',
                    addon: true,
                    icon: 'fa fa-calendar',
                    // value: Global.jalaliToGregorian(persianDate(SERVERDATE).subtract('days', 30).format('YYYY-MM-DD'))
                }
            }
        ]
        , statusbar: []
        , flags: {}
        , events: {
            'click [type=submit]': 'submit'
            , 'click [data-task=refresh-view]': 'reLoad'
            , 'click [data-task=show]': 'loadItems'
            , 'click [data-task=refresh]': 'reLoad'
        }
        , reLoad: function () {
            this.load();
        }
        , load: function (e, extend) {
            console.info('Loading items');
            var params = this.getParams();
            params = (typeof extend === "object") ? $.extend({}, params, extend) : params;
            this.render(params);
        }
        , loadItems: function (params) {
            var self = this;
            var template = Template.template.load('stats/crawl', 'crawlitems.partial');
            var $container = $('#items');
            var params = typeof params !== 'undefined' ? params : this.getParams();
            var query = $.param(params);
            var model = new CrawlModel({overrideUrl: 'crawl/log', query: query});
            model.fetch({
                success: function (data) {
                    var items = self.prepareItems(data.toJSON(), $.extend({}, {overrideUrl: 'crawl/log'}, params));
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(items);
                        console.log(output);
                        $container.html(output).promise().done(function () {
                            // self.afterRender();
                            $("#items-table").bootstrapTable(Config.settings.bootstrapTable);
                        });
                    });
                }
            });
        }
        , getParams: function (showDetails) {
            return {
                start: $("[name=startdate]").val() ? Global.jalaliToGregorian($("[name=startdate]").val()) : Global.today()
                , end: $("[name=startdate]").val() ? Global.jalaliToGregorian($("[name=startdate]").val()) : Global.today()
                // , end: $("[name=enddate]").val() ? Global.jalaliToGregorian($("[name=enddate]").val()) : Global.today()
                , detail: typeof showDetails !== 'undefined' && showDetails ? showDetails : false
            }
        }
        , render: function (params) {
            var self = this;
            var template = Template.template.load('stats/crawl', 'crawl');
            var $container = $(Config.positions.main);
            template.done(function (data) {
                var handlebarsTemplate = Template.handlebars.compile(data);
                var output = handlebarsTemplate({});
                $container.html(output).promise().done(function () {
                    self.afterRender();
                });
            });
        }
        , afterRender: function () {
            this.renderStatusbar();
            this.attachDatepickers();
            this.loadItems();
        }
        , attachDatepickers: function () {
            var self = this;
            var $datePickers = $(".datepicker");
            $.each($datePickers, function () {
                var $this = $(this);
                if ($this.data('datepicker') == undefined) {
                    $this.pDatepicker($.extend({}, CONFIG.settings.datepicker, {
                        onSelect: function () {
//                            self.render();
                        }
                    }));
                }
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
            var data = [{}];
            $(this.$modal).find("input, textarea, select").each(function () {
                var $input = $(this);
                if (typeof $input.attr("name") !== "undefined") {
                    data[0][$input.attr("name")] = (/^\d+$/.test($input.val()) || ($input.attr("data-validation") === 'digit')) ? +$input.val() : $input.val();
                    if (typeof $input.attr('data-before-save') !== "undefined") {
                        switch ($input.attr('data-before-save')) {
                            case 'prepend-date':
                                data[0][$input.attr("name")] = Global.jalaliToGregorian($(this).parent().find("label").text()) + 'T' + $input.val();
                                break;
                            case 'timestamp':
                                data[0][$input.attr("name")] = Global.processTime($input.val());
                                break;
                        }
                    }
                }
            });
            return data;
        }
        , updateStats: function ($rows) {
            var stats = {duration: 0, count: 0, totalbroadcast: 0, totalrepeats: 0};
            $rows.each(function () {
                if ($(this).is(":visible")) {
                    stats.count++;
                    stats.duration += $(this).data('duration');
                    $(this).find(".idx").html(stats.count);

                    if ($(this).find(".broadcast-count").text() > 0) {
                        stats.totalbroadcast += ($(this).data('duration'));
                        stats.totalrepeats += ($(this).data('duration') * ($(this).find(".broadcast-count").text() - 1));
                    }
                }
            });
            $("[data-type=duration]").html(Global.createTime2(stats.duration));
            $("[data-type=count]").html(stats.count);
            $("[data-type=totalbroadcast]").html(Global.createTime2(stats.totalbroadcast));
            $("[data-type=totalrepeats]").html(Global.createTime2(stats.totalrepeats));
        }
        , processSum: function (items) {
            var data = {items: items, duration: 0, count: 0, totalbroadcast: 0, totalrepeats: 0, header: true};
            $.each(items, function () {
                data.count++;
                data.duration += this.Duration;

                if (this.ConductorUseCount > 0) {
                    data.totalbroadcast += this.Duration;
                    data.totalrepeats += (this.Duration * (this.ConductorUseCount - 1));
                }
            });
            return data;
        }
        , updatePrintButton: function () {
            var $printButton = $(".print-btn");
            var dates = '&startdate=' + Global.jalaliToGregorian($("[name=startdate]").val()) + 'T00:00:00' + '&enddate=' + Global.jalaliToGregorian($("[name=enddate]").val()) + 'T23:59:59';
            if ($printButton.length && $printButton.attr('href').indexOf('startdate') === -1)
                $printButton.attr('href', $printButton.attr('href') + dates);
        }
        , renderStatusbar: function () {
            var elements = this.statusbar;
            var statusbar = new Statusbar();
            $.each(elements, function () {
                statusbar.addItem(this);
            });
            statusbar.render();
        }
    });
    return StatsCrawlView;
});
