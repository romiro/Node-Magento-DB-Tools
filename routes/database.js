var util = require('util');
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

    siteProfiles = webApp.locals.siteProfiles;
    //Auto DB Sanitizer & Downloader
    webApp.get('/database', function(req, resp){
        resp.render('database');
    });

    webApp.post('/testDatabaseConnection', function(req, resp){
        var controller = new DatabaseConnection(req, resp, 'test');
    });

    webApp.post('/runDatabaseConfiguration', function(req, resp){
        var controller = new DatabaseConnection(req, resp, 'run');
    });

    webApp.post('/testMysqlDump', function(req, resp){
        var controller = new DatabaseConnection(req, resp, 'testdump');
    });
};

function DatabaseConnection(req, resp, type) {
    var data = req.body;
    var returnJson = {messages:[]};
    var siteProfile = siteProfiles.get(data['site-profile']);
    var sshConfig = SSHConfig.getHostByName(siteProfile['sshConfigName']);
    var dbData, dbCommands;

    var sshOptions = {
        host: sshConfig['host'],
        port: 22,
        username: sshConfig['user']
    };

    //Determine if password or key, setup object to pass to new SSHConn as appropriate
    if (data['pass-or-key'] == 'password') {
        sshOptions['password'] = data['password'];
    }

    var conn = new SSHConn();

    switch (type) {
        case "testdump":
            conn.onReady(function(){
                testMysqlDump();
            });

            break;
        default:
            conn.onReady(function(){
                checkSitePath();
            });
            break;
    }

    function testMysqlDump() {
        getLocalXml(function(){
            firstCommand();
        });

        function firstCommand() {
            var command = dbCommands.firstCommand;
            conn.connection.exec(command, {pty: true}, function(err, stream){
                if (err) {
                    console.log(err);
                }
                enterPassword(stream);

                stream.on('exit', function(exitCode){
                    console.log('Finished first mysqldump command, executing next...');
                    secondCommand();
                });
            });
        }

        function secondCommand() {
            var command = dbCommands.secondCommand;
            conn.connection.exec(command, {pty: true}, function(err, stream){
                if (err) {
                    console.log(err);
                }
                enterPassword(stream);

                stream.on('exit', function(exitCode){
                    console.log('Finished second mysqldump command, file should be created.');
                    //TODO: Verify file's existence
                    conn.end();
                    returnJson['messages'].push(util.format('Directory %s does not exist on server', siteProfile['sitePath']));
                    resp.json(returnJson);
                });
            });
        }

        function enterPassword(stream) {
            stream.once('data', function(data){
                var string = ''+data;
                console.log("First data back from mysqldump: " + string);
                if (string == 'Enter password: ') {
                    stream.write(dbData.password + "\n");
                }
                else {
                    throw new Error('Error with password prompt on remote mysqldump command');
                }
            });
        }

        function checkFileExists() {

        }
    }

    /**
     * Attempt a connect, pass error in response if no go
     */

    conn.connect(sshOptions);

    /**
     * Confirm directory defined in siteProfile exists
     */
    function checkSitePath() {
        var command = util.format('cd %s', siteProfile['sitePath']);
        conn.connection.exec(command, function(err, stream){
            if (err) {
                console.error(err);
                returnJson['error'] = err.message;
                resp.json(returnJson);
            }
            stream.on('exit', function(exitCode){
                if (exitCode == 1) {
                    returnJson['messages'].push(util.format('Directory %s does not exist on server', siteProfile['sitePath']));
                    resp.json(returnJson);
                }
                else {
                    returnJson['messages'].push(util.format('Directory %s found on server', siteProfile['sitePath']));
                    //Continue async into below method
                    getLocalXml();
                }
            });
        });
    }

    /**
     * Gets local.xml from production path defined in site profile
     */
    function getLocalXml(callback) {

        var filePath = path.join(path.normalize(siteProfile['sitePath']), 'app', 'etc', 'local.xml');
        var command = util.format('cat %s', filePath);
        var localXml = '';
        conn.connection.exec(command, function(err, stream){
            if (err) {
                console.error(err);
                returnJson['error'] = err.message;
                resp.json(returnJson);
            }

            stream.on('data', function(data){
                localXml += data;
            });

            stream.on('exit', function(exitCode){
                if (exitCode == 1) {
                    returnJson['error'] = util.format('Did not find local.xml at %s on server', filePath);
                    resp.json(returnJson);
                }
                else if (exitCode == 0){ //File found, data should have collected into localXml

                    var parser = new LocalXmlParser();
                    parser.setIgnoredTables(data.tables);
                    try {
                        parser.parse(localXml);
                    }
                    catch (e) {
                        resp.end(e.message);
                        return;
                    }
                    returnJson['messages'].push(util.format('Found local.xml at %s', filePath));
                    dbCommands = parser.commands;
                    dbData = parser.data;
                    if (!callback) {
                        checkMysqldump();
                    }
                    else {
                        callback();
                    }
                }
                else {
                    returnJson['messages'].push('Something weird happened while trying to cat local.xml on server');
                    resp.json(returnJson);
                }
            });
        });

    }

    /**
     * Determine that mysqldump command is available
     */
    function checkMysqldump() {
        conn.connection.exec('mysqldump', function(err, stream){
            if (err) {
                console.error(err);
                returnJson['error'] = err.message;
                resp.json(returnJson);
            }
            stream.on('exit', function(exitCode){
                if (exitCode == 127) { //127 = command not found
                    returnJson['error'] = 'mysqldump command does not exist or is not accessible on server!';
                }
                else {
                    returnJson['messages'].push('mysqldump command exists');
                }
                checkMysqlConnection();
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
                myConn.query('SHOW TABLES', function(err, rows, fields) {
                    if (err) {
                        returnJson.error = err.message;
                        resp.json(returnJson);
                    }
                    else {
                        returnJson.messages.push('MySQL credentials are correct');
                        returnJson.messages.push('MySQL tunnel connection established successfully!');
                        myConn.end(function(){
                            tunnel.closeTunnel();
                        });
                        resp.json(returnJson);
                    }
                });
            });
        });
    }
}

module.exports = new DatabaseRoute();