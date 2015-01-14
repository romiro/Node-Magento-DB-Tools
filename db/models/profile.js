var util = require('util');
var Model = require('../model');

function Profile(db) {
    this.tableName = 'Profile';

    //Call constructor of parent (Model)
    Profile.super_.call(this, db);
}
util.inherits(Profile, Model);

Profile.prototype.getByJoined = function(column, search, callback){
    var conn = this.db.connection;
    var statement = util.format(
        'SELECT * FROM Profile ' +
        'INNER JOIN Server ON Profile.server_id = Server.id ' +
        'INNER JOIN Client ON Server.client_id = Client.id ' +
        'WHERE %s = "%s"',
        column, this.sanitize(search)
    );

    conn.all(statement, function(err, rows){
        if (err) throw err;
        callback(rows);
    });
};

module.exports = Profile;
