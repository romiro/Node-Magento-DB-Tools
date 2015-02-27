var util = require('util');
var Model = require('../model');
var _ = require('underscore');

function Profile(db) {
    this.tableName = 'Profile';

    //Call constructor of parent (Model)
    Profile.super_.call(this, db);
}
util.inherits(Profile, Model);

Profile.prototype.getByJoined = function(column, search, callback){
    var self = this;
    var conn = this.db.connection;
    var statement = util.format('SELECT Profile.id as id, ' +
        'profile_name, magento_path, excluded_tables, tables, ' +
        'Client.id as client_id, client_name, client_code, ' +
        'Server.id as server_id, server_name, ssh_host, ssh_username ' +
        'FROM Profile ' +
        'INNER JOIN Server ON Profile.server_id = Server.id ' +
        'INNER JOIN Client ON Server.client_id = Client.id ' +
        'WHERE %s = ?',
        column
    );

    search = this.sanitize(search);

    conn.all(statement, [search], function(err, rows){
        if (err) throw err;
        callback(self.afterGetJoined(rows));
    });
};

Profile.prototype.getAllJoined = function(callback){
    var self = this;
    var conn = this.db.connection;
    var statement = 'SELECT Profile.id as id, ' +
        'profile_name, magento_path, excluded_tables, tables, ' +
        'Client.id as client_id, client_name, client_code, ' +
        'Server.id as server_id, server_name, ssh_host, ssh_username ' +
        'FROM Profile ' +
        'INNER JOIN Server ON Profile.server_id = Server.id ' +
        'INNER JOIN Client ON Server.client_id = Client.id';

    conn.all(statement, function(err, rows){
        if (err) throw err;
        callback(self.afterGetJoined(rows));
    });
};

Profile.prototype.afterGetJoined = function(rows) {
    _.each(rows, function(row, i){
        rows[i]['excluded_tables'] = JSON.parse(rows[i]['excluded_tables']);
        rows[i]['tables'] = JSON.parse(rows[i]['tables']);
    });
    return rows;
};

module.exports = Profile;
