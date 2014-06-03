var util = require('util');
var path = require('path');

var xpath = require('xpath');
var xmldom = require('xmldom');

var SSHConn = require('../lib/ssh-conn');
var SSHConfig = require('../lib/ssh-config-reader');
var JsonStore = require('../lib/json-store');


function DatabaseRoute() {}

DatabaseRoute.prototype.use = function(webApp) {
    var siteProfiles = webApp.locals.siteProfiles;

    //Auto DB Sanitizer & Downloader
    webApp.get('/database', function(req, resp){
        resp.render('database');
    });

    webApp.post('/testDatabaseConnection', function(req, resp){
        var data = req.body;
        var returnJson = {};
        var siteProfile = siteProfiles.get(data['site-profile']);
        var sshConfig = SSHConfig.getHostByName(siteProfile['sshConfigName']);

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
            //Confirm directory defined in siteProfile exists
            var command = util.format('cd %s', siteProfile['sitePath']);
            conn.connection.exec(command, function(err, stream){
                if (err) {
                    console.error(err);
                    returnJson['error'] = err.message;
                    resp.json(returnJson);
                }
                stream.on('exit', function(exitCode){
                    if (exitCode == 1) {
                        returnJson['message'] = util.format('Directory %s does not exist on server', siteProfile['sitePath']);
                        resp.json(returnJson);
                    }
                    else {
                        //Continue async into below method
                        getLocalXml();
                    }
                });
            });
        });

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
                        returnJson['message'] = util.format('%s not found on server!', filePath);
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
                        checkMysqldump();
                    }
                    else {
                        returnJson['message'] = 'Something weird happened while trying to cat local.xml on server';
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
                        returnJson['message'] = 'mysqldump command does not exist or is not accessible on server!';
                    }
                    else {
                        returnJson['message'] = 'Production directory found, and mysqldump command exists';
                    }
                    resp.json(returnJson);
                });
            });
        }

        /**
         * Determine if a mysql connection can be established, and that the database exists
         */
        function checkMysqlConnection() {

        }

        conn.connect(sshOptions);

    });
};



function LocalXmlParser() {
    var host, username, password, dbname, data;
    var ignoredTables = [];

    var firstTemplate = function() {
        return 'mysqldump -d -h{{host}} -u{{username}} -p {{dbname}} > {{filename}}';
    };

    var secondTemplate = function(){
        var string = 'mysqldump -h{{host}} -u{{username}} -p';
        $('#table-checkboxes').find('input[type=checkbox]:checked').each(function(){
            string += ' --ignore-table={{table_prefix}}{{dbname}}.' + $(this).val();
        });
        string += " {{dbname}} >> {{filename}}";
        return string;
    };

    var fullDumpTemplate = function() {
        return 'mysqldump -h{{host}} -u{{username}} -p {{dbname}} | gzip -c | cat > {{filename}}.gz';
    };

    var clientTemplate = function(){
        return 'mysql -h{{host}} -u{{username}} -p {{dbname}}';
    };

    this.setIgnoredTables = function(tables) {
        ignoredTables = tables;
    };

    /**
     * Parse local xml using xpath
     *
     * @param localXml
     */
    this.parse = function(localXml) {
        var xmlDoc = new xmldom.DOMParser().parseFromString(localXml);

        var prefixNode = xpath.select("//db/table_prefix", xmlDoc);
        var tablePrefix = '';
        if (prefixNode.length) {
            tablePrefix = prefixNode[0].toString();
        }

        var dbNode = xpath.select("//resources/default_setup/connection", xmlDoc)[0];

        data = {
            host: dbNode.select("//host")[0].toString(),
            username: dbNode.select("//username")[0].toString(),
            password: dbNode.select("//password")[0].toString(),
            dbname: dbNode.select("//dbname")[0].toString(),
            table_prefix: tablePrefix,
            filename: dbNode.select("//host")[0].toString() + "-" + getDate() + ".sql"
        };

        var firstCommand = template(firstTemplate, data);
        var secondCommand = template(secondTemplate, data);
        var fullDumpCommand = template(fullDumpTemplate, data);
        var clientCommand = template(clientTemplate, data);

    };


    function template(templateFunction, data) {
        var string = templateFunction();
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