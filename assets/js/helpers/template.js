define(['jquery', 'underscore', 'backbone', 'handlebars', 'config', 'global', 'moment-hijri', 'authorization'
], function ($, _, Backbone, Handlebars, Config, Global, moment, Authorize) {
    var template = {
        handlebarHelpers: function () {
            if (typeof Handlebars === "undefined")
                return false;
            Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
                lvalue = parseFloat(lvalue);
                rvalue = parseFloat(rvalue);

                return {
                    "+": lvalue + rvalue,
                    "-": lvalue - rvalue,
                    "*": lvalue * rvalue,
                    "/": lvalue / rvalue,
                    "%": lvalue % rvalue
                }[operator];
            });
            Handlebars.registerHelper('times', function (n, block) { // Loop a block starting at 0
                var accum = '';
                for (var i = 0; i < n; ++i)
                    accum += block.fn(i);
                return accum;
            });
            Handlebars.registerHelper('debug', function (value, options) {
                console.log(value);
            });
            Handlebars.registerHelper('extractTime', function (value, options) {
                return (value && value.indexOf("T") !== -1) ? value.split('T')[1] : value;
            });
            Handlebars.registerHelper('extractDate', function (value, options) {
                return (value && value.indexOf("T") !== -1) ? Global.gregorianToJalali(value.split('T')[0]) : Global.gregorianToJalali(value);
            });
            Handlebars.registerHelper('htimes', function (n, block) { // Loop a block starting at 1 [human-readable times]
                var accum = '';
                for (var i = 1; i < (n + 1); ++i)
                    accum += block.fn(i);
                return accum;
            });
            Handlebars.registerHelper('for', function (from, to, incr, block) { // For loop {{#for i to steps}} -> {{#for 0 10 2}}
                var accum = '';
                for (var i = from; i < to; i += incr)
                    accum += block.fn(i);
                return accum;
            });
            Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
                switch (operator) {
                    case '==':
                        return (v1 == v2) ? options.fn(this) : options.inverse(this);
                    case '!=':
                        return (v1 != v2) ? options.fn(this) : options.inverse(this);
                    case '===':
                        return (v1 === v2) ? options.fn(this) : options.inverse(this);
                    case '<':
                        return (v1 < v2) ? options.fn(this) : options.inverse(this);
                    case '<=':
                        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                    case '>':
                        return (v1 > v2) ? options.fn(this) : options.inverse(this);
                    case '>=':
                        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                    case '&&':
                        return (v1 && v2) ? options.fn(this) : options.inverse(this);
                    case '||':
                        return (v1 || v2) ? options.fn(this) : options.inverse(this);
                    default:
                        return options.inverse(this);
                }
            });
            Handlebars.registerHelper('ifIsToday', function (value, options) {
                var givenDate = (value && value.indexOf("T") !== -1) ? value.split('T')[0] : value;
                var today = moment().format('YYYY-MM-DD');
                if (givenDate === today)
                    return '<i class="fa fa-clock-o"></i> ' + value.split('T')[1];
                return '<i class="fa fa-calendar"></i> ' + Global.gregorianToJalali(value.split('T')[0]);
            });
            Handlebars.registerHelper('ifCondNot', function (v1, v2, options) {
                if (v1 !== v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            });
            Handlebars.registerHelper('ifActive', function (val, options) {
                var currentID = (typeof Location.parts[2] === "undefined") ? 0 : Location.parts[2];
                if (parseInt(val) === parseInt(currentID)) {
                    return "grey-cascade";
                }
                return "btn-default";
            });
            Handlebars.registerHelper('stringify', function (obj, options) {
                if (typeof obj === "object") {
                    $.each(obj, function () {
                        delete this.raw;
                    });
                }
                var output = (typeof obj === "object") ? JSON.stringify(obj) : obj;
                return output;
            });
            Handlebars.registerHelper('Bool2Label', function (val, options) {
                var output = '';
                if (val === true) {
                    output = '<span class="label label-success">Yes</label>';
                } else {
                    output = '<span class="label label-warning">No</label>';
                }
                return output;
            });
            Handlebars.registerHelper('Num2Label', function (val, options) {
                var output = '';
                switch (val) {
                    case 0:
                        output = '<span class="label label-warning">No</label>';
                        break;
                    case 1:
                        output = '<span class="label label-success">Yes</label>';
                        break;
                }
                return output;
            });
            Handlebars.registerHelper('isChecked', function (val, options) {
                var output = '';
                if (val === true || val === 1) {
                    output = 'checked';
                }
                return output;
            });
            Handlebars.registerHelper('cycle', function (value, block) {
                var values = value.split(' ');
                return values[block.data.index % (values.length + 1)];
            });
            Handlebars.registerHelper('select', function (value, options) {
                var $el = $('<select />').html(options.fn(this));
                $el.find('[value=' + value + ']').attr({'selected': 'selected'});
                return $el.html();
            });
            Handlebars.registerHelper('createDate', function (offset, options) {
                return Global.createDate(offset);
            });
            Handlebars.registerHelper('time', function (timestamp, options) {
                return Global.createTime(timestamp);
            });
            Handlebars.registerHelper('seconds', function (time, options) {
                return Global.processTime(time);
            });
            Handlebars.registerHelper('config', function (value, options) {
                return Config[value];
            });
            Handlebars.registerHelper('getName', function (value, source, options) {
                return source[value];
            });
            Handlebars.registerHelper('formatJalali', function (value, format, options) {
                var date = (value && value.indexOf("T") !== -1) ? Global.gregorianToJalali(value.split('T')[0]).split('-') : Global.gregorianToJalali(value).split('-');
                for (var i = 0; i < date.length; i++)
                    date[i] = parseInt(date[i]);
                return persianDate(date).format(format);
            });
            Handlebars.registerHelper('formatGregorian', function (value, format, options) {
                var date = (value && value.indexOf("T") !== -1) ? value.split('T')[0].split('-') : value.split('-');
                for (var i = 0; i < date.length; i++)
                    date[i] = (i === 1) ? parseInt(date[i]) - 1 : parseInt(date[i]);
                return new moment(date).format(format);
            });
            Handlebars.registerHelper('formatHijri', function (value, format, options) {
                var date = (value && value.indexOf("T") !== -1) ? value.split('T')[0].split('-') : value.split('-');
                for (var i = 0; i < date.length; i++)
                    date[i] = (i === 1) ? parseInt(date[i]) - 1 : parseInt(date[i]);
                return new moment(date).format(format);
            });
            Handlebars.registerHelper('getMedia', function (value, options) {
                return value.replace('.jpg', '_lq.mp4');
            });
            Handlebars.registerHelper('resolveLabel', function (value, options) {
                var value = +value;
                switch (value) {
                    case 0:
                        return 'warning';
                    case 1:
                        return 'success';
                    case 10:
                        return 'info';
                    default:
                        return 'danger';
                }
            });
            Handlebars.registerHelper('getDefinitions', function (id, options) {
                var items = [];
                $.each(Config.definitions, function () {
                    var filters = this.Children;
                    $.each(filters, function () {
                        if (this.Id === id) {
                            var $this = this;
                            for (i = 0; i < $this.Children.length; i++) {
                                items.push({value: $this.Children[i].Value, text: $this.Children[i].Key});
                            }
                        }
                    });
                });
                return JSON.stringify(items);
            });
            Handlebars.registerHelper('getDefinitionOptions', function (id, options) {
                var items = '';
                $.each(Config.definitions, function () {
                    if (this.Id === id)
                        for (i = 0; i < this.Children.length; i++)
                            items += '<option value="' + this.Children[i].Value + '">' + this.Children[i].Key + '</option>';
                });
                return items;
            });
            Handlebars.registerHelper('getDefinitionCheckboxes', function (id, type, container, options) {
                var type = (typeof type !== "undefined") ? type : 'checkbox';
                var container = (typeof container !== "undefined") ? container : null;
                var items = '';
                $.each(Config.definitions, function () {
                    if (this.Id === id) 
                        for (i = 0; i < this.Children.length; i++)
                            items += (container ? '<' + container + '>' : '') + '<div class="checkbox checkbox-primary checkbox-circle col-xs-12"><input name="force" data-validation="digit" id="checkbox_df' + this.Children[i].Value + '" value="' + this.Children[i].Value + '" type="' + type + '"><label for="checkbox_df' + this.Children[i].Value + '">' + this.Children[i].Key + '</label></div>' + (container ? '</' + container + '>' : '');
//                            items += '<option value="' + this.Children[i].Value + '">' + this.Children[i].Key + '</option>';
                });
                return items;
            });
            Handlebars.registerHelper('authorize', function (action, options) {
                if (Authorize.access(action))
                    return options.fn(this);
                return options.inverse(this);
            });
        }
        , handlebarPartials: function () {
            Handlebars.registerPartial('scheduleRowTools', function () {
                var output = '<div class="tools"><button class="btn" data-task="add"><i class="fa fa-plus"></i></button><button class="btn" data-task="delete"><i class="fa fa-minus"></i></button></div>';
                return output;
            });
        }
        , load: function (path, file) {
            var bust = (CONFIG.env === "dev") ? '?bust=' + (new Date()).getTime() : '';
            return $.ajax({
                url: '/app/' + path + '/' + file + '.template.html' + bust
                , contentType: 'text/x-handlebars-template'
            });
        }
    };
    var handlebars = Handlebars;
    return {
        handlebars: handlebars
        , template: template
    };

});
