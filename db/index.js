
var sqlite3 = require('sqlite3');
var _ = require('underscore');

var Client = require('./models/client');
var Server = require('./models/server');
var Profile = require('./models/profile');


/*
Primary object for db access. Should have the three "models" attached to it,
as well as access to the "setup" script.
 */
function SqliteDb() {
    this.Client = new Client(this);
    this.Server = new Server(this);
    this.Profile = new Profile(this);
    this.connected = false;
}

SqliteDb.prototype.connect = function(filepath) {
    if (typeof filepath === 'undefined') {
        filepath = 'db/storage/test.sqlite';
    }
    this.connection = new sqlite3.Database(filepath);
    this.connected = true;
};

SqliteDb.prototype.run = function(statement, params) {
    this.connection.run.apply(this.connection, arguments);
};

module.exports = new SqliteDb();