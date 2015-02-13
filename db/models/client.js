var util = require('util');
var Model = require('../model');

function Client(db) {
    this.tableName = 'Client';

    //Call constructor of parent (Model)
    Client.super_.call(this, db);
}

util.inherits(Client, Model);

module.exports = Client;
