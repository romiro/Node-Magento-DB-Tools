var Clients = DatabaseView.subClass({
    init: function() {
        this._super();

        this.singularName = 'Client';
        this.pluralName = 'Clients';

        var self = this;
        this.getData(function(data){
            self.finish();
        });
    }
});