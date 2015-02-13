var sqlite3 = require('sqlite3');
var _ = require('underscore');

module.exports = function(callback) {

    var db = new sqlite3.Database('db/storage/main.sqlite');

    db.serialize(function(){

        db.run('CREATE TABLE Client ("id" INTEGER PRIMARY KEY ASC, "client_code" TEXT, "client_name" TEXT);');

        db.run('CREATE TABLE Server ('+
        'id INTEGER PRIMARY KEY ASC,'+
        'client_id INTEGER,'+
        'server_name TEXT,'+
        'ssh_host TEXT,'+
        'ssh_username TEXT'+
        ');');

        db.run('CREATE TABLE Profile ('+
        'id INTEGER PRIMARY KEY ASC,'+
        'server_id INTEGER,'+
        'profile_name TEXT,'+
        'magento_path TEXT,'+
        'tables TEXT,'+
        'excluded_tables TEXT'+
        ');', function(){
            callback();
        });
    });
};