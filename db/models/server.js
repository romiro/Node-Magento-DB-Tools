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
        'SELECT * FROM Server ' +
        'INNER JOIN Client ON Server.client_id = Client.id ' +
        'WHERE %s = "%s"',
        column, this.sanitize(search)
    );

    conn.all(statement, function(err, rows){
        if (err) throw err;
        callback(rows);
    });
};

Server.prototype.getAllJoined = function(callback){
    var conn = this.db.connection;
    var statement = 'SELECT * FROM Server INNER JOIN Client ON Server.client_id = Client.id';

    conn.all(statement, function(err, rows){
        if (err) throw err;
        callback(rows);
    });
};

module.exports = Server;
