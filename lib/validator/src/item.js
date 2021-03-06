define(function(require, exports, module) {
    var $ = require('jquery'),
        parser = require('./parser'),
        Base = require('base'),
        async = require('async'),
        ruleFactory = require('./ruleFactory');

    var Item = Base.extend({
        options: {
            //name: null,
            //rules: null,
            //display: null,
            //triggerType: null,
        },

        initialize: function(name, cfg) {
            var ele = $('[name=' + name +']');
            if (ele.length == 1) {
                ele = ele[0];
            } else if (ele.length == 0) {
                throw 'Element with name "' + name + '" is not found.' ;
            } else {
                ele = ele.get();
            }

            this.element = ele;

            //parser.parseDom(ele);
            this.setOptions(cfg);

            var triggerType = this.options.triggerType;

            if (triggerType) {
                var that = this;
                this.handler = function() {
                    that.execute();
                }
                $(ele).bind(triggerType.join(' '), this.handler);
            }
        },

        execute: function(callback) {
            var opt = this.options;

            var that = this;
            this.trigger('itemValidate', that.element);
            _metaValidate(this.element, opt.rules, opt.display, function(err, msg) {
                that.trigger('itemValidated', err, msg, that.element);
                //console.log(err, msg, that.element);
                callback && callback(err, msg, that.element);
            });
        },

        remove: function() {
            var handler = this.handler,
                ele = $(this.element);

            $.each(this.options.triggerType, function(i, item) {
                ele.unbind(item, handler);
            });
        }
    });


    function _metaValidate(ele, rules, display, callback) {

        if (!$.isArray(rules))
            throw 'No validation rule specified or not specified as an array.'
        
        var tasks = [];

        $.each(rules, function(i, item) {

            var obj = parser.parseRule(item),
                ruleName = obj.name,
                param = obj.param;

            var rule = ruleFactory.getOperator(ruleName);
            if (!rule)
                throw 'Validation rule with name "' + ruleName + '" cannot be found.';

            var options = $.extend({}, param, {
                element: ele,
                display: (param && param.display) || display || $(ele).attr('name'),
                ruleName: ruleName
            });

            tasks.push(function(cb) {
                rule(options, cb);
            });
        });

        async.series(tasks, function(err, results) {
            callback && callback(err, results[results.length - 1]);
        });
    }

    module.exports = Item;
});
