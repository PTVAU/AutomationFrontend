define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'jquery-ui', 'moment-with-locales', 'resources.review.model', 'mask', 'toastr', 'toolbar', 'statusbar', 'pdatepicker', 'reviewHelper', 'player.helper'
], function ($, _, Backbone, Template, Config, Global, ui, moment, ReviewModel, Mask, toastr, Toolbar, Statusbar, pDatepicker, ReviewHelper, Player) {
    var ReviewView = Backbone.View.extend({
        el: $(Config.positions.wrapper)
        , playerInstance: null
        , model: 'MetadataModel'
        , toolbar: [
            {'button': {cssClass: 'btn red pull-right', text: 'رد', type: 'button', task: 'reject'}}
            , {'button': {cssClass: 'btn green-jungle pull-right', text: 'قبول', type: 'button', task: 'accept'}}
            , {'button': {cssClass: 'btn btn-success', text: 'نمایش', type: 'button', task: 'load'}}
            , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'startdate', value: persianDate().subtract('days', 7).format('YYYY-MM-DD')}}
            , {'input': {cssClass: 'form-control datepicker', placeholder: '', type: 'text', name: 'enddate', value: persianDate().format('YYYY-MM-DD')}}
            , {'select': {text: 'فیلتر', name: 'filter-table', addon: true, icon: 'fa fa-filter', options: [
                        {value: '0', text: 'بازبینی نشده'}
                        , {value: '1', text: 'تائید شده'}
                        , {value: '2', text: 'رد شده'}
                    ]}}
        ]
        , statusbar: []
        , flags: {}
        , events: {
            'click [type=submit]': 'submit'
            , 'change [data-type=filter-table]': 'filterTable'
            , 'click #review-table tbody tr': 'collapseRow'
        }
        , collapseRow: function (e) {
            var $this = this;
            var $el = $(e.target);
            var $row = ($(e.target).is("tr")) ? $(e.target) : $(e.target).parents("tr:first");
            var media = {
                thumbnail: $row.attr('data-thumbnail')
                , video: $row.attr('data-media')
                , duration: $row.attr('data-duration')
            };
            var file = $row.attr('data-filename');
            var file = $row.attr('data-filename');
            if ($row.hasClass('active') || $row.hasClass('preview-pane') || $row.parents(".preview-pane").length || typeof media.video === "undefined")
                return;
            $el.parents("tbody").find("tr").removeClass('active');
            $row.addClass('active');
            if ($(document).find(".preview-pane").length)
                $(document).find(".preview-pane").fadeOut(200, function () {
                    var $target = $(this);
                    $this.player.remove();
                    window.setTimeout(function () {
                        $target.remove();
                    }, 50);
                });
            // Loading review partial template
            window.setTimeout(function () {
                var template = Template.template.load('resources/review', 'review.partial');
                template.done(function (data) {
                    var handlebarsTemplate = Template.handlebars.compile(data);
                    var output = handlebarsTemplate({});
                    $row.after(output).promise().done(function () {
                        var player = new Player('#player-container', {
                            image: media.thumbnail
//                            , file: media.video
                            , duration: media.duration
                            , playlist: [{
                                    sources: [
                                        {file: media.video, label: 'LQ', default: true}
                                        , {file: media.video.replace('_lq', '_hq'), label: 'HQ'}
//                                        , {file: media.video.replace('_lq', '_orig'), label: 'ORIG'}
                                    ]
                                }]
                        }, $this.handlePlayerCallbacks);
                        player.render();
                        $this.player = player;
                        $this.playerInstance = player.instance;
                    });
                });

            }, 300);

        }
        , filterTable: function (e) {
            alert($(e.target).val());
        }
        , submit: function () {
            var $this = this;
            var helper = new ReviewHelper.validate();
            if (!helper.beforeSave())
                return;
            var data = this.prepareSave();
            new MetadataModel().save(null, {
                data: JSON.stringify(data)
                , contentType: 'application/json'
                , processData: false
                , success: function () {
                    toastr.success('با موفقیت انجام شد', 'ذخیره کنداکتور', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                    $this.reLoad();
                }
            });
        }
        , reLoad: function () {
            this.load();
        }
        , load: function (e, extend) {
            console.info('Loading items');
            var params = {};
            params = (typeof extend === "object") ? $.extend({}, params, extend) : params;
            this.render(params);
        }
        , render: function (params) {
            var template = Template.template.load('resources/review', 'review');
            var $container = $(Config.positions.main);
            var model = new ReviewModel(params);
            var self = this;
            model.fetch({
                data: (typeof params !== "undefined") ? $.param(params) : null
                , success: function (items) {
                    items = self.prepareItems(items.toJSON(), params);
                    template.done(function (data) {
                        var handlebarsTemplate = Template.handlebars.compile(data);
                        var output = handlebarsTemplate(items);
                        $container.html(output).promise().done(function () {
                            self.afterRender();
                        });
                    });
                    self.renderToolbar();
                }
                , error: function (e, data) {
                    toastr.error(data.responseJSON.Message, 'خطا', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                    if ($("#review-table tbody tr").length)
                        $("#review-table tbody").empty();
                }
            });
        }
        , afterRender: function () {
            var $this = this;
            ReviewHelper.mask("time");
        }
        , handlePlayerCallbacks: function (instance, type, value) {
        }
        , renderToolbar: function () {
            var self = this;
            if (self.flags.toolbarRendered)
                return;
            var elements = self.toolbar;
            var toolbar = new Toolbar();
            $.each(elements, function () {
                var method = Object.getOwnPropertyNames(this);
                toolbar[method](this[method]);
            });
            toolbar.render();
            self.flags.toolbarRendered = true;

            var $datePickers = $(".datepicker");
            var datepickerConf = {
                onSelect: function () {
                    self.load();
                    $datePickers.blur();
                }
            };
            $.each($datePickers, function () {
                // TODO: Set default value to datepicker
                $(this).pDatepicker($.extend({}, CONFIG.settings.datepicker, datepickerConf));
            });
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
    return ReviewView;
});