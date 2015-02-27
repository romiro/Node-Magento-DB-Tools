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
                    done();
                });
            });
        });

        it('Should insert rows into the Client table without error', function(done){
            var db = sqliteDb;

            db.run('INSERT INTO Client (client_code, client_name) VALUES ("spk", "Speck")', function(err){
                if (err) throw err;
                done();
            });
        });

        it('Should retrieve the inserted row and validate using raw query', function(done){
            var db = sqliteDb;

            db.connection.get('SELECT client_name FROM Client WHERE client_code="spk"', function(err, row){
                if (err) throw err;
                expect(row.client_name).to.equal('Speck');
                done();
            });
        });

        it('Should retrieve the inserted row using prepared statement', function(done){
            var db = sqliteDb;
            var stmt = db.connection.prepare('SELECT client_name FROM Client WHERE client_code=?');
            stmt.get('spk', function(err, row){
                if (err) throw err;
                expect(row.client_name).to.equal('Speck');
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


    describe('Model API functionality', function(){

        it('Should insert record using method without error, and check that lastId is 1', function(done){
            var db = sqliteDb;
            db.Client.insert({client_name: 'Chrome Industries', client_code: 'cbs'}, function(lastId){
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
            db.Client.insert({client_name: 'Speck Products', client_code: 'spk'}, function(lastId){
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

        it('Should get a single record to verify above update has occurred', function(done){
            var db = sqliteDb;
            db.Client.getBy('id', 1, function(rows){
                expect(rows.length).to.equal(1);
                expect(rows[0]['client_code']).to.equal('chr');
                done();
            });
        });

        it('Should delete a record without error', function(done){
            var db = sqliteDb;
            db.Client.deleteBy('id', 2, function(numChanges){
                expect(numChanges).to.equal(1);
                done();
            });
        });

        it('Should insert a Server record to join with remaining Client', function(done){
            var db = sqliteDb;
            db.Server.insert({
                    client_id: 1,
                    server_name: 'web01',
                    ssh_host: '127.0.0.1',
                    ssh_username: 'blueacorn'
                },
                function(lastId){
                    expect(lastId).to.equal(1);
                    done();
                }
            );
        });

        it('Should get the Server record joined with the client data', function(done){
            var db = sqliteDb;
            db.Server.getByJoined('Server.id', 1, function(rows){
                expect(rows[0].client_code).to.equal('chr');
                done();
            });
        });

        it('Should get all Server records, joined', function(done){
            var db = sqliteDb;
            db.Server.getAllJoined(function(rows){
                expect(rows[0].client_code).to.equal('chr');
                done();
            });
        });

        it('Should insert a Profile record to join with the Server record', function(done){
            var db = sqliteDb;
            db.Profile.insert({
                    server_id: 1,
                    profile_name: 'Chrome Production',
                    magento_path: '/var/www/vhosts/chromeindustries.com/',
                    excluded_tables: ''
                },
                function(lastId){
                    expect(lastId).to.equal(1);
                    done();
                }
            );
        });

        it('Should get the Profile record joined with both Server and Client data', function(done){
            var db = sqliteDb;
            db.Profile.getByJoined('Profile.id', 1, function(rows){
                expect(rows[0].client_name).to.equal('Chrome Industries');
                expect(rows[0].server_name).to.equal('web01');
                expect(rows[0].magento_path).to.equal('/var/www/vhosts/chromeindustries.com/');
                done();
            });
        });

        it('Should get all Profile records, joined', function(done){
            var db = sqliteDb;
            db.Profile.getAllJoined(function(rows){
                expect(rows[0].client_code).to.equal('chr');
                done();
            });
        });
    });


    /**
     * Cleanup test
     */
    after(function(){
        fs.unlinkSync(path.join(dbFile));
    });
});