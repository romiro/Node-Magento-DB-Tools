var util = require('util');
var events = require("events");
var path = require('path');

var mysql = require('mysql');

var SSHConn = require('../lib/ssh-conn');
var SSHConfig = require('../lib/ssh-config-reader');
var SSHTunnel = require('../lib/ssh-tunnel');
var LocalXmlParser = require('../lib/localxml-parser');
var config = require('../config');

var siteProfiles;

function DatabaseRoute() {}

DatabaseRoute.prototype.use = function(webApp) {

    var options = {
        downloadPath: config.general.downloadPath
    };

    siteProfiles = webApp.locals.siteProfiles;
    //Auto DB Sanitizer & Downloader
    webApp.get('/database', function(req, resp){
        resp.render('database');
    });

    webApp.post('/testDatabaseConnection', function(req, resp){
        options['type'] = 'test';
        var db = new DatabaseConnection();
        var returnJson = {messages:[]};

        db.on('error', function(error){
            returnJson['error'] = error;
            resp.json(returnJson);
        });

        db.on('message', function(message){
            returnJson.messages.push(message);
        });

        db.on('finish', function(){
            db.conn.end();
            resp.json(returnJson);
        });

        db.start(req, resp, options);
    });

    webApp.post('/runDatabaseConfiguration', function(req, resp){
        options['type'] = 'run';
        var db = new DatabaseConnection();
        var returnJson = {messages:[]};

        db.on('error', function(error){
            returnJson['error'] = error;
            resp.json(returnJson);
        });

        db.on('message', function(message){
            returnJson.messages.push(message);
        });

        db.on('finish', function(){
            resp.json(returnJson);
        });

        db.start(req, resp, options);
    });

};


//TODO: Refactor out the reliance on the web app, use events to send messages and errors
function DatabaseConnection() {
    events.EventEmitter.call(this);
}

util.inherits(DatabaseConnection, events.EventEmitter);

DatabaseConnection.prototype.start = function(req, resp, options) {
    var self = this;
    var data = req.body; //TODO: Refactor into a set of options sent to var options
    var siteProfile = siteProfiles.get(data['site-profile']);
    var sshConfig = SSHConfig.getHostByName(siteProfile['sshConfigName']);

    var dbData, dbCommands, type;

    if (options) {
        type = options.type;
    }

    var sshOptions = {
        host: sshConfig['host'],
        port: 22,
        username: sshConfig['user']
    };

    //Determine if password or key, setup object to pass to new SSHConn as appropriate
    if (data['pass-or-key'] == 'password') {
        sshOptions['password'] = data['password'];
    }

    var conn = this.conn = new SSHConn();

    try {
        conn.onReady(function(){
            checkSitePath();
        });
    }
    catch (e) {
        self.emit('error', e);
    }

    conn.connect(sshOptions);

    /**
     * Confirm directory defined in siteProfile exists
     */
    function checkSitePath() {
        var command = util.format('cd %s', siteProfile['sitePath']);
        conn.connection.exec(command, function(err, stream){
            if (err) throw err;
            stream.on('exit', function(exitCode){
                if (exitCode == 1) {
                    self.emit('error', util.format('Directory %s does not exist on server', siteProfile['sitePath']));
                }
                else {
                    self.emit('message', util.format('Directory %s found on server', siteProfile['sitePath']));
                    //Continue async into below method
                    getLocalXml();
                }
            });
        });
    }

    /**
     * Gets local.xml from production path defined in site profile
     */
    function getLocalXml() {

        var filePath = path.join(path.normalize(siteProfile['sitePath']), 'app', 'etc', 'local.xml');
        var command = util.format('cat %s', filePath);
        var localXml = '';
        conn.connection.exec(command, function(err, stream){
            if (err) throw err;

            stream.on('data', function(data){
                localXml += data;
            });

            stream.on('exit', function(exitCode){
                if (exitCode == 1) {
                    self.emit('error', util.format('Did not find local.xml at %s on server', filePath));
                }
                else if (exitCode == 0){ //File found, data should have collected into localXml

                    var parser = new LocalXmlParser({dumpDirectory: '~/'});
                    parser.setIgnoredTables(data.tables);
                    try {
                        parser.parse(localXml);
                    }
                    catch (e) {
                        self.emit('error', e.message);
                        return;
                    }
                    self.emit('message', util.format('Found local.xml at %s', filePath));
                    dbCommands = parser.commands;
                    dbData = parser.data;

                    checkMysqldump();
                }
                else {
                    self.emit('error', 'Something weird happened while trying to cat local.xml on server');
                }
            });
        });
    }

    /**
     * Determine that mysqldump command is available
     */
    function checkMysqldump() {
        conn.connection.exec('mysqldump', function(err, stream){
            if (err) throw err;
            stream.on('exit', function(exitCode){
                if (exitCode == 127) { //127 = command not found
                    self.emit('error', 'mysqldump command does not exist or is not accessible on server!');
                }
                else {
                    self.emit('message', 'mysqldump command exists');
                    checkMysqlConnection();
                }
            });
        });
    }

    /**
     * Determine if a mysql connection can be established, and that the database exists
     */
    function checkMysqlConnection() {
        var tunnel = new SSHTunnel();
        tunnel.newConnection(sshOptions);
        tunnel.startTunnel(dbData.host, 3306, function(){
            var myConn = mysql.createConnection({
                host: '127.0.0.1',
                port: config.tunnel.port,
                user: dbData.username,
                password: dbData.password,
                database: dbData.dbname
            });

            myConn.connect(function(){
                self.emit('message', 'MySQL tunnel connection established successfully!');

                myConn.query('SHOW TABLES', function(err, rows, fields) {
                    if (err) {
                        self.emit('message', 'Problem trying to run SHOW TABLES command on MySQL server:');
                        self.emit('error', err);
                    }
                    else {
                        self.emit('message', 'MySQL credentials are correct');
                        myConn.end(function(){
                            tunnel.closeTunnel();
                        });
                        runMysqlDump();
                    }
                });
            });
        });
    }

    function runMysqlDump() {
        //Run "frist command" as defined in local xml parser
        firstCommand();

        function firstCommand() {
            var command = dbCommands.firstCommand;
            conn.connection.exec(command, {pty: true}, function(err, stream){
                if (err) throw err;

                stream.on('exit', function(exitCode){
                    self.emit('message', 'Finished first mysqldump command, executing next...');
                    secondCommand();
                });

                enterPassword(stream);
            });
        }

        function secondCommand() {
            var command = dbCommands.secondCommand;
            conn.connection.exec(command, {pty: true}, function(err, stream){
                if (err) throw err;

                stream.on('exit', function(exitCode){
                    if (exitCode == 0) {
                        self.emit('message', 'Finished second mysqldump command, file should be created.');
                        checkFileExists();
                    }
                    else {
                        conn.end();
                        self.emit('error', 'mysqldump command did not exit successfully');
                    }
                });

                enterPassword(stream);
            });
        }

        function checkFileExists() {
            var command = util.format('find ~/%s -type f', dbData.filename);
            conn.connection.exec(command, function(err, stream){
                if (err) throw err;
                var returnString;
                stream.once('data', function(data){
                    returnString = ''+data;
                });
                stream.on('exit', function(exitCode){
                    if (exitCode == 0) {
                        self.emit('message', util.format('Dump file found at: %s', returnString));
                        compressFile();
                    }
                    else {
                        self.emit('error', util.format('Dump file not found: %s', returnString));
                    }
                });
            });
        }

        function compressFile() {
            var command = util.format('gzip ~/%s', dbData.filename);
            var outFilename = util.format('%s.gz', dbData.filename);
            conn.connection.exec(command, function(err, stream){
                if (err) throw err;
                var returnString = '';

                stream.on('data', function(data){
                    returnString += data;
                });

                stream.on('exit', function(exitCode){
                    if (exitCode == 0) {
                        self.emit('message', 'File compressed successfully');
                        downloadFile();
                    }
                    else {
                        self.emit('error', util.format('gzip returned an error while compressing dump file: %s', returnString));
                    }
                });
            });
        }

        function downloadFile() {
            self.emit('finish');
        }

        function enterPassword(stream) {
            stream.once('data', function(data){
                var string = ''+data;
                if (string == 'Enter password: ') {
                    stream.write(dbData.password + "\n");
                }
                else {
                    throw new Error('Error with password prompt on remote mysqldump command');
                }
            });
        }
    }
}


module.exports = new DatabaseRoute();