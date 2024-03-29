define(['jquery', 'underscore', 'backbone', 'template', 'config', 'user', 'toolbar', 'statusbar', 'website.service'
], function ($, _, Backbone, Template, Config, User, Toolbar, Statusbar, WebsiteService) {

    var WebsiteItemView = Backbone.View.extend({
        data: {}
        , events: {
            'click [data-task="edit"]': 'loadEditPage'
        }
        , toolbar: [
            {'button': {cssClass: 'btn green-jungle', text: 'ویرایش', type: 'button', task: 'edit', icon: 'fa fa-edit'}}
        ]
        , render: function () {
            var self = this;
            var id = this.getId();
            var template = Template.template.load('website/item', 'item');
            this.renderToolbar();
            WebsiteService.getItem(id, function (item) {
                template.done(function (data) {
                    var handlebarsTemplate = Template.handlebars.compile(data);
                    var output = handlebarsTemplate(item);
                    $(Config.positions.main).html(output).promise().done(function () {
                        self.afterRender();
                    });
                });
            });
            return this;
        }
        , getId: function () {
            var lastPart = Backbone.history.getFragment().split("/").pop().split("?")[0];
            return isNaN(parseInt(lastPart)) ? null : lastPart;
        }
        , loadEditPage: function (e) {
            e.preventDefault();
            var id = this.getId();
            !Backbone.History.started && Backbone.history.start({pushState: true});
            new Backbone.Router().navigate('website/edit/' + id, {trigger: true});
        }
        , afterRender: function () {

        }
        , renderToolbar: function () {
            var self = this;
            var toolbar = new Toolbar();
            $.each(self.toolbar, function () {
                var method = Object.getOwnPropertyNames(this);
                toolbar[method](this[method]);
            });
            toolbar.render();
        }
        , prepareContent: function () {

        }
    });

    return WebsiteItemView;

});
