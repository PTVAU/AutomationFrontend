define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'moment-with-locales', 'resources.ingest.model', 'mask', 'toastr', 'toolbar', 'statusbar', 'pdatepicker', 'ingestHelper', 'tree.helper', 'tus', 'bootstrap/modal'
], function ($, _, Backbone, Template, Config, Global, moment, IngestModel, Mask, toastr, Toolbar, Statusbar, pDatepicker, IngestHelper, Tree, tus) {
    var IngestView = Backbone.View.extend({
        el: $(Config.positions.wrapper)
        , $modal: "#metadata-form-modal"
        , model: 'IngestModel'
        , toolbar: [
//            {'button': {cssClass: 'btn green-jungle pull-right', text: 'ذخیره', type: 'submit', task: 'save'}}
            {'button': {cssClass: 'btn blue-sharp hidden', text: 'ثبت اطلاعات <span class="index"></span>', type: 'button', task: 'add'}}
        ]
        , statusbar: []
        , flags: {}
        , events: {
            'click [type=submit]': 'submit'
            , 'click [data-task=add]': 'openAddForm'
            , 'click #storagefiles': 'selectRow'
            , 'focus .has-error input': function(e) {
                $(e.target).parents(".has-error:first").removeClass('has-error');
            }
        }
        , submit: function (e) {
            e.preventDefault();
            var $this = this;
            var helper = new IngestHelper.validate();
            if (!helper.beforeSave())
                return;
            var data = this.prepareSave();
            new IngestModel({overrideUrl: Config.api.metadata}).save(null, {
                data: JSON.stringify(data)
                , contentType: 'application/json'
                , processData: false
                , success: function () {
                    toastr.success('با موفقیت انجام شد', 'ذخیره اطلاعات برنامه', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                    $this.reLoad();
                }
            });
        }
        , openAddForm: function (e) {
            $(this.$modal).modal('toggle');
        }
        , selectRow: function (e) {
            var $el = $(e.target);
            var $row = $el.parents("tr:first");
            $el.parents("tbody").find("tr").removeClass('active');
            $row.addClass('active');
            $row.find("[data-prop]").each(function () {
                if ($('input[name="' + $(this).attr('data-prop') + '"]').length)
                    $('input[name="' + $(this).attr('data-prop') + '"]').val($.trim($(this).text()));
            });
            $('button[data-task=add]').removeClass('hidden').find("span").html($.trim($row.find('[data-type="index"]').text()));
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
            var template = Template.template.load('resources/ingest', 'ingest');
            var $container = $(Config.positions.main);
            var model = new IngestModel(params);
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
                }
            });
        }
        , afterRender: function () {
            IngestHelper.mask("time");
            $("#tree").length && new Tree($("#tree"), Config.api.tree).render();
            $("#toolbar button[type=submit]").removeClass('hidden').addClass('in');
            if (typeof this.flags.helperLoaded === "undefined") {
                IngestHelper.init();
                this.flags.helperLoaded = true;
            } else
                IngestHelper.init(true);
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
    });
    return IngestView;
});