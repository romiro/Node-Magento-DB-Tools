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

    describe('Database schema import, inserts, and selects', function(){
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

            db.run('INSERT INTO Client (client_code, name) VALUES ("spk", "Speck")', function(err){
                if (err) throw err;
                done();
            });
        });

        it('Should retrieve the inserted row and validate using raw query', function(done){
            var db = sqliteDb;

            db.connection.get('SELECT name FROM Client WHERE client_code="spk"', function(err, row){
                if (err) throw err;
                expect(row.name).to.equal('Speck');
                done();
            });
        });

        it('Should retrieve the inserted row using prepared statement', function(done){
            var db = sqliteDb;
            var stmt = db.connection.prepare('SELECT name FROM Client WHERE client_code=?');
            stmt.get('spk', function(err, row){
                if (err) throw err;
                expect(row.name).to.equal('Speck');
                done();
            });
        });

        it('Should delete the row from the table', function(done){
            var db = sqliteDb;
            db.connection.run('DELETE FROM Client WHERE client_code="spk"', function(err){
                if (err) throw err;
                expect(this.changes).to.equal(1);
                done();
            });
        });
    });


    describe('Model functionality', function(){

        it('Should insert record using method without error, and check that lastId is 1', function(done){
            var db = sqliteDb;
            db.Client.insert({name: 'Chrome Industries', client_code: 'cbs'}, function(lastId){
                expect(lastId).to.equal(1);
                done();
            });
        });

        it('Should get all client records without error, and record length should be 1', function(done){
            var db = sqliteDb;
            db.Client.getAll(function(records){
                expect(records).to.be.an.instanceof(Array);
                expect(records.length).to.equal(1);
                done();
            });
        });

        it('Should insert a second record without error, and check that lastId is 2', function(done){
            var db = sqliteDb;
            db.Client.insert({name: 'Speck Products', client_code: 'spk'}, function(lastId){
                expect(lastId).to.equal(2);
                done();
            });
        });

        it('Should update first record with a new client_code without error', function(done){
            var db = sqliteDb;
            db.Client.update({id: 1, client_code: 'chr'}, function(numChanges){
                expect(numChanges).to.equal(1);
                done();
            });
        });

        it('Should get a single record and verify the update has occurred', function(done){

        });
    });


    /**
     * Cleanup test
     */
    after(function(){
        fs.unlinkSync(path.join(dbFile));
    });
});