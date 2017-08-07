// TODO: Colors for crawl items
// TODO: Using real data services
// TODO: Make editor as an standalone helper
define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'moment-with-locales', 'broadcast.crawl.model', 'mask', 'toastr', 'toolbar', 'statusbar', 'pdatepicker', 'crawlHelper', 'bootbox', 'jquery-ui', 'player.helper', 'bootstrap/modal', 'bootstrap/transition', 'bootstrap/tab', 'bootstrap/collapse'
], function ($, _, Backbone, Template, Config, Global, moment, CrawlModel, Mask, toastr, Toolbar, Statusbar, pDatepicker, CrawlHelper, bootbox, ui, Player) {
    bootbox.setLocale('fa');
    var CrawlView = Backbone.View.extend({
        model: 'CrawlModel'
        , playerInstance: {}
        , toolbar: [
            {'button': {cssClass: 'btn purple-wisteria pull-right', text: 'کپی', type: 'button', task: 'show-duplicate-form'}}
            , {'button': {cssClass: 'btn red-flamingo pull-right', text: "ارسال زیرنویس", type: 'button', task: 'show-export-form'}}
            , {'button': {cssClass: 'hide', text: '', type: 'button', task: 'null'}}
        ]
        , statusbar: [

        ]
        , flags: {}
        , events: {
            'click [type=submit]': 'submit'
            , 'click [data-task=load]': 'load'
            , 'click [data-task=add-repository]': 'addToRepository'
            , 'click [data-task=add-crawl]': 'addSingle'
            , 'change [data-type="type-select"]': 'loadRepositoryItems'
            , 'click [data-task="add-crawls"]': 'addBatch'
            , 'click .crawl-items-select tbody tr': 'toggleRowSelection'
            , 'click [data-task=show-duplicate-form]': 'showDuplicateToolbar'
            , 'click [data-task=show-export-form]': 'showExportToolbar'
            , 'click [data-task=show-repository]': 'toggleRepositoryForm'
            , 'change [name=force]': 'warnForceDuplicate'
            , 'click [data-task="review"]': 'reviewItem'
            , 'click .crawl-items [data-task="delete"]': 'deleteItem'
//            , 'click .repository-items [data-task="review"]': 'reviewRepoItem'
            , 'click .repository-items [data-task="delete"]': 'deleteRepoItem'
            , 'click .editor-toolbar .btn': function (e) {
                e.preventDefault();
                var button = $(e.currentTarget);
                switch (button.attr('data-task')) {
                    case 'bold':
                        document.execCommand("bold");
                        break;
                    case 'italic':
                        document.execCommand("insertHTML", false, '<i>' + document.getSelection() + "</i>");
                        break;
                    case 'color':
                        var value = button.attr('data-value');
                        document.execCommand("insertHTML", false, '<font color="' + value + '">' + document.getSelection() + "</font>");
                        break;
                }
            }
            , 'paste .editable-input': function (e) {
                e.preventDefault();
                var text = e.originalEvent.clipboardData.getData("text/plain");
                document.execCommand("insertHTML", false, text);
            }
        }
        , reviewItem: function(e) {
            var text = $(e.target).parents('tr').find('.text').html();
            $(".editable-input").html(text);
            e.preventDefault();
        }
        , deleteItem: function(e) {
            alert('delete item');
            e.preventDefault();
        }
//        , reviewRepoItem: function(e) {
//            var text = $(e.target).parent().find('.text').text();
//            e.preventDefault();
//        }
        , deleteRepoItem: function(e) {
            alert('delete item');
            e.preventDefault();
        }
        , toggleRepositoryForm: function (e) {
            var $target = $(".repository-pane");
            if ($target.is(":visible"))
                $target.slideUp(300);
            else
                $target.slideDown(300);
        }
        , warnForceDuplicate: function (e) {
            var $checkbox = $(e.target);
            if ($checkbox.is(":checked"))
                $("#schedule-overwrite-alert").addClass('in');
            else
                $("#schedule-overwrite-alert").removeClass('in');
        }
        , showDuplicateToolbar: function () {
            if ($("#sub-toolbar").find(".portlet").not(".duplicate-crawl").is(":visible"))
                $("#sub-toolbar").find(".portlet").not(".duplicate-crawl").removeClass("in").addClass("hidden");
            if ($("#sub-toolbar .duplicate-crawl").is(":hidden"))
                $("#sub-toolbar .duplicate-crawl").removeClass('hidden').addClass("in");
            else
                $("#sub-toolbar .duplicate-crawl").removeClass("in").addClass("hidden");
            $("html, body").animate({'scrollTop': 0});
        }
        , showExportToolbar: function () {
            if ($("#sub-toolbar").find(".portlet").not(".export-crawl").is(":visible"))
                $("#sub-toolbar").find(".portlet").not(".export-crawl").removeClass("in").addClass("hidden");
            if ($("#sub-toolbar .export-crawl").is(":hidden"))
                $("#sub-toolbar .export-crawl").removeClass('hidden').addClass("in");
            else
                $("#sub-toolbar .export-crawl").removeClass("in").addClass("hidden");
            $("html, body").animate({'scrollTop': 0});
        }
        , toggleRowSelection: function (e) {
            e.preventDefault();
            $(e.currentTarget).find("input[type=checkbox]").prop("checked", !$(e.currentTarget).find("input[type=checkbox]").prop("checked"));
            return true;
        }
        , loadRepositoryItems: function (e) {
            e.preventDefault();
            var select = $(this);
            // TODO: Load items based on selected items type
        }
        , addBatch: function (e) {
            e.preventDefault();
            var self = this;
            var items = $(".crawl-items-select").find("input[type=checkbox]:checked");
            items.each(function () {
                var row = $(this).parents("tr:first");
                self.addCrawl({
                    content: row.find(".text").html()
                    , type: $('[data-type="type-select"]').val()
                });
            });
        }
        , addSingle: function (e) {
            var self = this;
            e.preventDefault();
            $editor = $(".editable-input");
            if ($editor.text() === "")
                return;
            self.addCrawl({
                content: $editor.html()
                , type: $('[data-type="type-select"]').val()
            });
        }
        , addCrawl: function (params) {
            $(".crawl-items").find("tbody").append('<tr><td><span class="label label-info label-sm">' + $('[data-type="type-select"]').find(":selected").text() + '</span> <span class="text">' + params.content + '</span></td></tr>');
        }
        , addToRepository: function (e) {
            e.preventDefault();
            $editor = $(".editable-input");
            if ($editor.text() === "")
                return;
            var params = {
                content: $editor.html()
                , type: $('[data-type="type-select"]').val()
            };
            // Save item and get insert id
            var id = 0;
            $(".crawl-items-select").find("tbody").append('<tr data-id="' + id + '"><td><div class="checkbox checkbox-success checkbox-circle"><input type="checkbox" /><label></label></div></td><td><span class="text">' + params.content + '</span></td></tr>');
        }
        , submit: function (e) {
            e.preventDefault();
            var $this = this;
            var helper = new CrawlModel.validate();
            if (!helper.beforeSave())
                return;
            var data = this.prepareSave();
            new CrawlModel().save(null, {
                data: JSON.stringify(data)
                , contentType: 'application/json'
                , processData: false
                , success: function () {
                    toastr.success('با موفقیت انجام شد', 'ذخیره کنداکتور', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                    $this.reLoad();
                }
            });
        }
        , selectInput: function (e) {
            $(e.target).trigger('select');
        }
        , refreshList: function (e) {
            e.preventDefault();
            var target = $(e.currentTarget).attr('data-target');
            switch (target) {
                case 'export':
                    break;
            }
        }
        , reLoad: function () {
            this.load();
        }
        , loadCrawls: function () {
            // TODO
            this.load();
        }
        , load: function (e, extend) {
            console.info('Loading items');
            var params = {
                startdate: Global.jalaliToGregorian($("[name=startdate]").val()) + 'T00:00:00'
                , enddate: Global.jalaliToGregorian($("[name=startdate]").val()) + 'T23:59:59'
            };
            params = (typeof extend === "object") ? $.extend({}, params, extend) : params;
            this.render(params);
        }
        , render: function (params) {
            var template = Template.template.load('broadcast/crawl', 'crawl');
            var $container = $(Config.positions.main);
            var model = new CrawlModel(params);
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
                }
                , error: function (e, data) {
                    toastr.error(data.responseJSON.Message, 'خطا', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                    if ($("#crawl-page tbody tr").length)
                        $("#crawl-page tbody").empty();
                }
            });
            self.renderStatusbar();
        }
        , afterRender: function () {
            var self = this;
            CrawlHelper.mask("time");
            $("#toolbar button[type=submit]").removeClass('hidden').addClass('in');
            if (typeof this.flags.helperLoaded === "undefined") {
                CrawlHelper.init();
                this.flags.helperLoaded = true;
            } else
                CrawlHelper.init(true);
            var $datePickers = $(".datepicker");
            var datepickerConf = {
                onSelect: function () {
                    self.loadCrawls();
                    $datePickers.blur();
                }
            };
            $.each($datePickers, function () {
                $(this).pDatepicker($.extend({}, CONFIG.settings.datepicker, datepickerConf));
            });
            $(".crawl-items").sortable({
                items: "tr"
                , cancel: 'a, button'
                , axis: 'y'
                , forcePlaceholderSize: true
                , placeholder: ".sort-placeholder"
                , containment: "parent"
            });
        }
        , renderToolbar: function () {
            var self = this;
            var elements = this.toolbar;
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
            var data = [];
            var $rows = $("table:first tbody tr");
            $rows.each(function () {
                var row = {};
                $(this).find("input, textarea, select").each(function () {
                    var $input = $(this);
                    if ($input.parents(".preview-pane").length)
                        return;
                    if (typeof $input.attr("name") !== "undefined") {
                        row[$input.attr("name")] = (/^\d+$/.test($input.val()) || ($input.attr("data-validation") === 'digit')) ? +$input.val() : $input.val();
                        if (typeof $input.attr('data-before-save') !== "undefined") {
                            switch ($input.attr('data-before-save')) {
                                case 'prepend-date':
                                    row[$input.attr("name")] = Global.jalaliToGregorian($(this).parent().find("label").text()) + 'T' + $input.val();
                                    break;
                                case 'timestamp':
                                    row[$input.attr("name")] = Global.processTime($input.val());
                                    break;
                            }
                        }
                    }
                });
                if (!_.isEmpty(row))
                    data.push(row);
            });
            return data;
        }
    });
    return CrawlView;
});