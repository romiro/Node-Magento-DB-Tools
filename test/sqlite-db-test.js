var fs = require('fs');
var path = require('path');

var chai = require('chai');
var expect = chai.expect;

var sqliteDb = require('../db');

var dbFile = 'test/storage/test.sqlite';

describe('sqlite database', function(){

    describe('main database object functionality', function(){

        it('Requires main object and confirms existence', function(){
            var db = sqliteDb;
            expect(db).to.exist();
        });

        it('Can connect to sqlite database without error', function(){
            var db = sqliteDb;
            db.connect(dbFile);
        });

        it('Gets the Client model and confirm is not null or undefined', function(){
            var db = sqliteDb;
            expect(db.Client).to.exist();
        });

        it('Gets the Server model and confirm is not null or undefined', function(){
            var db = sqliteDb;
            expect(db.Server).to.exist();
        });

        it('Gets the Profile model and confirm is not null or undefined', function(){
            var db = sqliteDb;
            expect(db.Profile).to.exist();
        });
    });

    describe('Database schema import and verification', function(){
        it('Should create a database based on given schema without error', function(done){
            var db = sqliteDb;
            db.connect(dbFile);
            db.connection.serialize(function(){
                db.connection.run('CREATE TABLE Client ("id" INTEGER PRIMARY KEY ASC, "client_code" TEXT, "name" TEXT);');

                db.connection.run('CREATE TABLE Server ('+
                'id INTEGER PRIMARY KEY ASC,'+
                'client_id INTEGER,'+
                'name TEXT,'+
                'ssh_host TEXT,'+
                'ssh_username TEXT'+
                ');');

                db.connection.run('CREATE TABLE Profile ('+
                'id INTEGER PRIMARY KEY ASC,'+
                'server_id INTEGER,'+
                'name TEXT,'+
                'magento_path TEXT,'+
                'excluded_tables TEXT'+
                ');');
                done();
            });
        });

        it('Should insert rows into the Client table without error', function(done){
            var db = sqliteDb;

            db.connection.run('INSERT INTO Client (client_code, name) VALUES ("spk", "Speck")', function(err){
                if (err) throw err;
                done();
            });
        });

        it('Should retrieve the inserted row and validate', function(done){
            var db = sqliteDb;

            db.connection.get('SELECT name FROM Client WHERE client_code="spk"', function(err, row){
                if (err) throw err;
                expect(row.name).to.equal('Speck');
                done();
            });
        });
    });
/*

    describe('Client functionality', function(){

        it('Should get all client records without error', function(){
            var db = sqliteDb;
            db.connect();
            db.connection.serialize(function(){
                var records = db.Client.getAll();
                console.log(records);
            });
        });
    });
*/


    /**
     * Cleanup test
     */
    after(function(){
        fs.unlinkSync(path.join(dbFile));
    });
});