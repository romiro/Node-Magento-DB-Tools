var sqlite3 = require('sqlite3');
var _ = require('underscore');

var db = new sqlite3.Database('db/storage/test.sqlite');

db.serialize(function(){
    db.run('CREATE TABLE Client ("id" INTEGER PRIMARY KEY ASC, "client_code" TEXT, "name" TEXT);');

    db.run('CREATE TABLE Server ('+
    'id INTEGER PRIMARY KEY ASC,'+
    'client_id INTEGER,'+
    'name TEXT,'+
    'ssh_host TEXT,'+
    'ssh_username TEXT'+
    ');');

    db.run('CREATE TABLE Profile ('+
    'id INTEGER PRIMARY KEY ASC,'+
    'server_id INTEGER,'+
    'name TEXT,'+
    'magento_path TEXT,'+
    'excluded_tables TEXT'+
    ');');

});