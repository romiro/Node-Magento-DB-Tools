var util = require('util');
var Model = require('../model');

function Server(db) {
    //Call constructor of parent (Model)
    Server.super_.call(this, db);

    this.tableName = 'Server';
    this.joinStatement = 'INNER JOIN Client ON Server.client_id = Client.id';
}
util.inherits(Server, Model);

Server.prototype.getByJoined = function(column, search, callback){
    var conn = this.db.connection;
    var statement = util.format(
        'SELECT Server.id as id, server_name, ssh_host, ssh_username, ' +
        'Client.id as client_id, client_code, client_name ' +
        'FROM Server INNER JOIN Client ON Server.client_id = Client.id' +
        'WHERE %s = ?',
        column
    );

    search = this.sanitize(search);

    conn.all(statement, [search], function(err, rows){
        if (err) throw err;
        callback(rows);
    });
};

Server.prototype.getAllJoined = function(callback){
    var conn = this.db.connection;
    var statement = 'SELECT Server.id as id, server_name, ssh_host, ssh_username, ' +
        'Client.id as client_id, client_code, client_name ' +
        'FROM Server INNER JOIN Client ON Server.client_id = Client.id';

    conn.all(statement, function(err, rows){
        if (err) throw err;
        callback(rows);
    });
};

module.exports = Server;
