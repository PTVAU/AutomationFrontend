define(['jquery', 'underscore', 'backbone', 'template', 'config', 'global', 'users.manage.model', 'toastr', 'toolbar', 'bootstrap/modal'
], function ($, _, Backbone, Template, Config, Global, UsersManageModel, toastr, Toolbar) {
    var UsersManageView = Backbone.View.extend({
//        el: $(Config.positions.wrapper)
        modal_register: '#register-modal'
        , toolbar: [
            {'button': {cssClass: 'btn btn-success', text: 'جستجو', type: 'submit', task: 'load_users'}}
            , {'input': {cssClass: 'form-control', placeholder: 'جستجو', type: 'text', name: 'q', value: "", text: "جستجو", addon: true, icon: 'fa fa-search'}}
            , {'button': {cssClass: 'btn btn-primary pull-right', text: 'کاربر جدید', type: 'button', task: 'add-user', icon: 'fa fa-plus'}}
        ]
        , flags: {}
        , events: {
            'click [data-task=add-user]': 'loadRegisterForm'
            , 'submit #user-register': 'register'
        }
        , loadRegisterForm: function (e) {
            e.preventDefault();
            var self = this;
//            var params = {};
            var template = Template.template.load('user', 'user.register.partial');
            var $modal = $(self.modal_register);
            template.done(function (params) {
                var handlebarsTemplate = Template.handlebars.compile(params);
                var output = handlebarsTemplate({});
                $modal.find(".modal-body").html(output).promise().done(function () {
                    $modal.modal('show');
                });
            });
        }
        , register: function (e) {
            e.preventDefault();
            var data = $(e.currentTarget).serializeObject();
            if (!this.validateRegisterForm($(e.currentTarget), data))
                return;
            var params = {path: '/register'};
            new UsersManageModel(params).save(null, {
                data: JSON.stringify(data)
                , contentType: 'application/json'
                , success: function (d) {
                    console.log(d);
                }
                , error: function (z, x, c) {
                    console.log(z, x, c);
                }
            });
            return false;
        }
        , validateRegisterForm: function ($form, data) {
//            return data;
            var error = false;
            $form.find('.form-control').each(function () {
                if ($(this).prop('required') && ($(this).val() === "" || !$(this).val()))
                    error = {msg: 'اطلاعات فیلدهای اجباری باید وارد شود!', type: 'warning'};
                if (typeof $(this).attr('data-validation') !== "undefined") {
                    switch ($(this).attr('data-validation')) {
                        case 'confirm-pass':
                            var val = $(this).val();
                            $('[data-validation=confirm-pass]').each(function () {
                                if ($(this).val() !== val) {
                                    error = {msg: 'رمزهای عبور با هم یکسان نیستند.', type: 'warning'};;
                                }
                            });
                            break;
                    }
                }
            });
            if (error) {
                toastr[error.type](error.msg, 'خطا', {positionClass: 'toast-bottom-left', progressBar: true, closeButton: true});
                return false;
            }
            return true;
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
            var self = this;
            var params = {};
            var model = new UsersManageModel(params);
            var template = Template.template.load('users/manage', 'manage');
            var $container = $(Config.positions.main);
            model.fetch({
                success: function (items) {
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
        }
        , renderToolbar: function () {
            var self = this;
//            if (self.flags.toolbarRendered)
//                return;
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
            this.renderToolbar();
        }
        , prepareSave: function () {
            data = null;
            return data;
        }
    });
    return UsersManageView;
});