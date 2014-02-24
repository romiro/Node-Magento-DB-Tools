var Tools;
jQuery(
function(){
    var navigation = new Navigation();

    Tools = {
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

});