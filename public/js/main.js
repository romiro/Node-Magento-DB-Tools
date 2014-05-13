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