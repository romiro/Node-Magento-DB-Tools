var util = require('util');
var Model = require('../model');

function Server(db) {
    this.tableName = 'Server';

    //Call constructor of parent (Model)
    Server.super_.call(this, db);
}

util.inherits(Server, Model);

module.exports = Server;
