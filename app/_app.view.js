define(['jquery', 'underscore', 'backbone', 'template', 'config', 'cookie', 'toolbar', 'bootstrap/dropdown'
], function ($, _, Backbone, Template, Config, Cookies, ToolbarHelper) {
    var AppView = Backbone.View.extend({
//        el: $(Config.positions.wrapper)
        render: function (view, content, actionArray) {
            console.log(view);
            if (this.currentView) {
                this.currentView.remove();
            }
            // Render view
            view.render(content, actionArray);
            this.currentView = view;

            return this;
        }
        , load: function (actions, actionArray) {
            var self = this;
            if (actions === 404) {
                this.render404();
                return;
            }
            if (typeof actions !== "undefined" && actions) {
                var request = (actions === '' || actions === '/') ? 'dashboard.view' : (actions.replace(/\$/, '') + '.view').replace(/\//g, '.');
                requirejs([request], function (View) {
                    var view = new View(actions, actionArray);
                    var content = (typeof view.prepareContent !== "undefined") ? view.prepareContent() : null;
                    self.render(view, content, actionArray);

                    // Setting active menu
                    var $sidebarMenu = $(Config.positions.sidebar).find("ul:first");
                    $sidebarMenu.find("li").removeClass("active open");
                    $sidebarMenu.find('a[href="/' + actions + '"]').parents("li").addClass("active open");
                });
            }
            return this;
        }
        , render404: function () {
            $("body").attr('class', 'page-404-full-page');
            $(Config.positions.wrapper).html('<div class="page-404"><div class="number font-red"> 404 </div><div class="details"><h3>پیدا نشد!</h3><p>متاسفانه صفحه مورد نظر شما وجود ندارد.<br><a href="/"> بازگشت به داشبورد </a></p></div></div></div>');
        }
    });
    return AppView;
});