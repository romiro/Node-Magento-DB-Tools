var fs = require('fs');
var sqlite3 = require('sqlite3');
var _ = require('underscore');

module.exports = function(callback) {
    var db;

    fs.mkdir('db/storage', function(err){
        db = new sqlite3.Database('db/storage/main.sqlite', setupDb);
    });

    function setupDb(err) {
        if (err) throw err;
        db.serialize(function(){

            db.run('CREATE TABLE Client (' +
            'id INTEGER PRIMARY KEY ASC,' +
            'client_code TEXT,' +
            'client_name TEXT,' +
            'client_color TEXT);', handleCallback);

            db.run('CREATE TABLE Server ('+
            'id INTEGER PRIMARY KEY ASC,'+
            'client_id INTEGER,'+
            'server_name TEXT,'+
            'ssh_host TEXT,'+
            'ssh_username TEXT'+
            ');', handleCallback);

            db.run('CREATE TABLE Profile ('+
            'id INTEGER PRIMARY KEY ASC,'+
            'server_id INTEGER,'+
            'profile_name TEXT,'+
            'magento_path TEXT,'+
            'tables TEXT,'+
            'excluded_tables TEXT,' +
            'position INTEGER'+
            ');', function(err){
                handleCallback.call(this, err);
                callback();
            });
        });
    }
    function handleCallback(err) {
        if (err) throw err;
    }
};