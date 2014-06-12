var util = require('util');
var path = require('path');

var libxmljs = require("libxmljs");
var _ = require('underscore');
var mysql = require('mysql');

var SSHConn = require('../lib/ssh-conn');
var SSHConfig = require('../lib/ssh-config-reader');
var SSHTunnel = require('../lib/ssh-tunnel');
var JsonStore = require('../lib/json-store');
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
};

function DatabaseConnection(req, resp, type) {
    var data = req.body;
    var returnJson = {messages:[]};
    var siteProfile = siteProfiles.get(data['site-profile']);
    var sshConfig = SSHConfig.getHostByName(siteProfile['sshConfigName']);
    var dbData;

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

    /**
     * Attempt a connect, pass error in response if no go
     */
    conn.onReady(function(){
        checkSitePath();
    });

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
    function getLocalXml() {
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
                    dbData = parser.data;
                    checkMysqldump();
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


function LocalXmlParser() {
    var host, username, password, dbname, data;
    var firstTemplate, secondTemplate, fullDumpTemplate, testConnTemplate;
    var ignoredTables = [];

    firstTemplate = 'mysqldump --skip-lock-tables --single-transaction -d -h{{host}} -u{{username}} -p {{dbname}} > {{filename}}';

    secondTemplate = function(){
        var string = 'mysqldump --skip-lock-tables --single-transaction -h{{host}} -u{{username}} -p';

        _.each(ignoredTables, function(value){
            string += ' --ignore-table={{table_prefix}}{{dbname}}.' + value;
        });
        string += " {{dbname}} >> {{filename}}";
        return string;
    };

    fullDumpTemplate = 'mysqldump --skip-lock-tables --single-transaction -h{{host}} -u{{username}} -p {{dbname}} | gzip -c | cat > {{filename}}.gz';

    testConnTemplate = 'mysql -h{{host}} -u{{username}} -p --execute="SELECT ALL FROM {{table_prefix}}core_config_data WHERE path LIKE \'%url%\';" {{dbname}}';

    this.commands = {};

    /**
     * Sets private var for ignored tables
     * @param tables
     */
    this.setIgnoredTables = function(tables) {
        ignoredTables = tables;
    };

    /**
     * Parse local xml using libxmljs and xpath
     *
     * @param localXml
     */
    this.parse = function(localXml) {
        var xmlDoc = libxmljs.parseXml(localXml);

        var tablePrefix = xmlDoc.get('//db/table_prefix').text();

        var dbNode = xmlDoc.get('//resources/default_setup/connection');
        var dbName = dbNode.get('//dbname').text();

        this.data = data = {
            host: dbNode.get('host').text(),
            username: dbNode.get('username').text(),
            password: dbNode.get('password').text(),
            dbname: dbName,
            table_prefix: tablePrefix,
            filename: dbName + "-" + getDate() + ".sql"
        };

        this.commands = {
            firstCommand: template(firstTemplate, data),
            secondCommand: template(secondTemplate, data),
            fullDumpCommand: template(fullDumpTemplate, data),
            testConnCommand: template(testConnTemplate, data)
        };

        return {data: this.data, commands: this.commands};
    };

    function template(_template, data) {
        var string = (typeof _template == 'function') ? _template() : _template;
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var re = new RegExp("{{"+key+"}}", "gi");
                string = string.replace(re, data[key]);
            }
        }
        return string;
    }

    function getDate() {
        var date = new Date();
        var month = (date.getMonth() + 1).toPrecision();
        var day = date.getDate().toPrecision();
        var string = '';

        string += date.getFullYear();
        string += month.length == 1 ? "0" + month : month;
        string += day.length == 1 ? "0" + day : day;
        return string;
    }
}

module.exports = new DatabaseRoute();