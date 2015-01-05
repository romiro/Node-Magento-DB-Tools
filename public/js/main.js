var formatRegExp = /%[sdj%]/g;
var Tools = {

    getSshConfig: function(callback) {
        $.ajax({
            url: '/getSshConfig',
            dataType: 'json',
            success: function(data) {
                var out = {};
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        out[data[key]['label']] = data[key];
                    }
                }
                callback(out);
            }
        });
    },

    /**
     * Ripped from node's util library. Won't work in IE or something! Watch out!
     *
     * @param ctor
     * @param superCtor
     */
    inherits: function(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
    },


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
        $inputs = $inputs.not('[type=hidden]');

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

jQuery(
function(){
    var navigation = new Navigation();
});