var formatRegExp = /%[sdj%]/g;
var Tools = {

    format: function(f) {
        if (typeof f !== 'string') {
            var objects = [];
            for (var i = 0; i < arguments.length; i++) {
                objects.push(inspect(arguments[i]));
            }
            return objects.join(' ');
        }

        var i = 1;
        var args = arguments;
        var len = args.length;
        var str = String(f).replace(formatRegExp, function(x) {
            if (x === '%%') return '%';
            if (i >= len) return x;
            switch (x) {
                case '%s': return String(args[i++]);
                case '%d': return Number(args[i++]);
                case '%j': return JSON.stringify(args[i++]);
                default:
                    return x;
            }
        });
        for (var x = args[i]; i < len; x = args[++i]) {
            if (x === null || typeof x !== 'object') {
                str += ' ' + x;
            } else {
                str += ' ' + inspect(x);
            }
        }
        return str;
    },

    capitalize: function(str) {
        var parts = str.split('');
        parts[0] = parts[0].toUpperCase();
        return parts.join('');
    },

    getSiteProfilesSelect: function(callback) {
        Tools.getSiteProfiles(function(data){
            var $select = $('<select class="form-control" name="site-profile"></select>');
            $select.append('<option value="">Select a site profile...</option>');
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    $select.append($('<option></option>').val(key).text(data[key]['profileName']));
                }
            }
            callback($select, data);
        });
    },

    validate: function validate($inputs, $container) {
        var errors = false;
        $container.find('.error').remove();
        $inputs = $inputs.not('[type=hidden]').not('[type=checkbox]');

        $inputs.each(function(i, input){
            if ($(input).val() == '') {
                $(input).after('<span class="error text-danger">Value cannot be empty.</span>');
                errors = true;
            }
        });

        if (errors) {
            Tools.addAlert('Please fix the errors and re-submit', {className:'error', type:'danger', container: $container});
            return false;
        }
        return true;
    },

    /**
     * Takes three options in object: className, type (based on bootstrap styles), and clear.
     * If clear is set to false, existing alerts will not be removed prior to displaying
     *
     * @param message
     * @param options
     */
    addAlert: function(message, options) {
        var $alert = $('<div class="alert"></div>');
        var $container = options.container ? $(options.container) : $('.main-container');
        var type = 'danger';

        if (options.className) {
            $alert.addClass(options.className);
        }
        if (options.type) {
            type = options.type;
        }
        $alert.addClass('alert-'+type);

        if (typeof options.clear == 'undefined' || options.clear == true) {
            $container.find('.alert').remove();
        }
        $alert.text(message);
        $container.prepend($alert);
    },

    showWait: function() {
        $('body').addClass('wait');
    },

    hideWait: function() {
        $('body').removeClass('wait');
    }
};



//Resig's subclass method, extends native Object with new method
(function () {
    var initializing = false,
        superPattern = /xyz/.test(function () {
            xyz;
        }) ? /\b_super\b/ : /.*/;

    Object.subClass = function (properties) {
        var _super = this.prototype;
        initializing = true;
        var proto = new this();
        initializing = false;

        for (var name in properties) {
            proto[name] = typeof properties[name] == "function" && typeof _super[name] == "function" && superPattern.test(properties[name]) ? (function (name, fn) {
                return function () {
                    var tmp = this._super;
                    this._super = _super[name];
                    var ret = fn.apply(this, arguments);
                    this._super = tmp;
                    return ret;
                };
            })(name, properties[name]) : properties[name];
        }

        function Class() {
            if (!initializing && this.init) {
                this.init.apply(this, arguments);
            }
        }

        Class.prototype = proto;
        Class.constructor = Class;
        Class.subClass = arguments.callee;
        return Class;
    };
})();

jQuery(
function(){
    new Navigation();
});