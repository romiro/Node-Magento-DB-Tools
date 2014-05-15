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

    getSiteProfiles: function(callback) {
        $.ajax({
            url: '/getSiteProfiles',
            dataType: 'json',
            success: callback
        });
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

    /**
     * Takes three options in object: className, type (based on bootstrap styles), and clear.
     * If clear is set to false, existing alerts will not be removed prior to displaying
     *
     * @param message
     * @param options
     */
    addAlert: function(message, options) {
        var $alert = $('<div class="alert"></div>');
        var $container = $('.main-container');
        if (options.className) {
            $alert.addClass(options.className);
        }
        if (options.type) {
            $alert.addClass('alert-'+options.type);
        }
        else {

        }
        if (typeof options.clear == 'undefined' || options.clear == true) {
            $container.find('.alert').remove();
        }
        $alert.text(message);
        $container.prepend($alert);
    },

    buildSelect: function(name, options) {
        var $select = $('<select></select>').attr('name', name);

        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                var option = ('<option></option>').attr('name', key).text(options[key]);
                $select.append(option);
            }
        }
        return $select;
    }
};

jQuery(
function(){
    var navigation = new Navigation();
});