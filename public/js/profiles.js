var Profiles = DatabaseView.subClass({
    init: function() {
        this._super();

        this.singularName = 'Profile';
        this.pluralName = 'Profiles';
        var self = this;

        this.getData(function(){
            Tools.getSshConfig(function(data){
                //Add SSH Config values to select, pulled from ajax json response
                var $select = $('<select class="form-control" name="ssh-config-name"></select>');
                $select.append('<option value="">Select an SSH Config entry...</option>');
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        $select.append($('<option></option>').val(key).text(data[key]['label']));
                    }
                }
                self.$template.find('.ssh-config').append($select);
                self.finish();
            });
        });
    }
});