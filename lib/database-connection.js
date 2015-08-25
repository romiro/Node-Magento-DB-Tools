var util = require('util');
var events = require("events");
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var mysql = require('mysql');
var pty = require('pty');


var Tools = require('./tools');
var SSHConn = require('./ssh-conn');
var LocalXmlParser = require('./localxml-parser');
var SSHTunnel = require('./ssh-tunnel');
var config = require('../config');
var Logger = require('./logger');

var isRunning = false;

//Define object and inherit EventEmitter as per documentation
function DatabaseConnection() {
    events.EventEmitter.call(this);
}
util.inherits(DatabaseConnection, events.EventEmitter);
/**
 *
 * @param options
 *      siteProfile: object of site profile properties to be used during dump
 *      downloadPath: (optional) string defining the absolute path where db dumps will be downloaded to
 *      password: (optional) string of password used to connect to SSH server
 *      type: (optional) string of 'test' or 'run', defaults to 'test'
 *      ignoredTables: (optional) array of tables that will be ignored during dump
 * @returns {boolean} of success or failure. message and error events will be dispatched prior
 *
 */
DatabaseConnection.prototype.start = function(options) {
    var self = this,
        dbData,
        dbCommands,
        type,
        ignoredTables,
        sitePath,
        downloadPath;

    var conn = this.conn = new SSHConn();

    if (isRunning) {
        self.emit('error', 'A dump is currently running in this instance. Cannot continue until first finishes.');
        return false;
    }

    //Options checking
    type = options.type ? options.type : 'test';
    ignoredTables = options.ignoredTables ? options.ignoredTables : [];

    if (!options['siteProfile']) {
        self.emit('error', 'No site profile defined in options, cannot continue.');
        return false;
    }
    var siteProfile = options['siteProfile'];
    var profileDesc = util.format('%s - %s - %s', siteProfile['client_name'], siteProfile['server_name'], siteProfile['profile_name']);

    sitePath = siteProfile['magento_path'];

    var sshOptions = {
        host: siteProfile['ssh_host'],
        port: 22,
        username: siteProfile['ssh_username']
    };

    if (options['passOrKey'] == 'password') {
        if (!options['password']) {
            self.emit('error', 'Login type of password chosen, but no password set!');
            return false;
        }
        sshOptions['password'] = options['password'];
    }

    //Setup logging
    var logger = new Logger('dumper.log').init();
    self.on('message', function(message){
        logger.writeWithStamp(message);
    });

    self.on('error', function(message){
        logger.writeWithStamp(message);
        self.emit('finish');
        if (conn.connected) {
            conn.end();
        }
    });

    self.on('finish', function(){
        isRunning = false;
        self.emit('message', util.format('FINISHED %s DUMP FOR [ %s ]\n', type.toUpperCase(), profileDesc));
    });

    self.emit('message', util.format('STARTING NEW %s DUMP FOR [ %s ]', type.toUpperCase(), profileDesc ));

    //Check that defined downloadPath exists and is writable
    downloadPath = options.downloadPath || config.general.downloadPath;
    if (!checkDownloadPath(downloadPath)) {
        return false;
    }

    //Set up primary SSH connection
    conn.onReady(function(){
        try {
            checkSitePath();
        }
        catch (e) {
            self.emit('error', e);
        }
    });

    conn.connect(sshOptions);

    function checkDownloadPath(downloadPath) {
        if (!fs.existsSync(downloadPath)) {
            self.emit('error', 'downloadPath defined in config.js does not exist');
            return false;
        }

        try {
            fs.openSync(path.join(downloadPath, 'testfile.txt'), 'w');
            fs.unlinkSync(path.join(downloadPath, 'testfile.txt'));
        }
        catch (e) {
            if (e.code == 'EACCES') {
                self.emit('error', 'downloadPath defined in config.js is not writable');
            }
            else {
                self.emit('error', util.format('Problem while checking for permissions to write to downloadPath: %s', e.message));
            }
            return false;
        }
        return true;
    }

    /**
     * Confirm directory defined in siteProfile exists
     */
    function checkSitePath() {
        var command = util.format('cd %s', sitePath);
        conn.connection.exec(command, function(err, stream){
            if (err) throw err;
            stream.on('exit', function(exitCode){
                if (exitCode == 1) {
                    self.emit('error', util.format('Directory %s does not exist on server', sitePath));
                }
                else {
                    self.emit('message', util.format('Directory %s found on server', sitePath));
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

        var filePath = path.join(path.normalize(sitePath), 'app', 'etc', 'local.xml');
        var command = util.format('cat %s', filePath);
        var localXml = '';
        conn.connection.exec(command, function(err, stream){
            if (err) throw err;

            stream.on('data', function(data){
                localXml += data;
            });

            stream.on('end', function() {

                var parser = new LocalXmlParser({dumpDirectory: '~/'});
                parser.setIgnoredTables(ignoredTables);
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
            });

            stream.on('exit', function(exitCode){
                if (exitCode == 1) {
                    self.emit('error', util.format('Did not find local.xml at %s on server', filePath));
                }
                else if (exitCode == 0){
                    //File found, data should have collected into localXml, should continue into end event
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
                    self.emit('message', 'mysqldump command exists on server');
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
                database: dbData.dbname,
                insecureAuth: true
            });

            myConn.connect(function(err){
                if (err) {
                    self.emit('message', 'Problem connecting to mysql server:');
                    self.emit('error', util.inspect(err));
                    return false;
                }
                self.emit('message', 'MySQL tunnel connection established successfully!');

                myConn.query('SHOW TABLES', function(err, rows, fields) {
                    if (err) {
                        self.emit('message', 'Problem trying to run SHOW TABLES command on MySQL server:');
                        self.emit('error', util.inspect(err));
                        myConn.end(function(){
                            console.log('Closing MySQL Tunnel...');
                            tunnel.closeTunnel();
                        });
                    }
                    else {
                        self.emit('message', 'MySQL credentials are correct');

                        //This is where type=test and type=run diverge
                        if (type == 'run') {
                            runMysqlDump();
                        }
                        else {
                            self.emit('message', 'Finished testing connection and parameters');
                            self.emit('finish');
                        }
                    }
                    myConn.end(function(){
                        console.log('Closing MySQL Tunnel...');
                        tunnel.closeTunnel();
                    });
                });
            });
        });
    }

    function runMysqlDump() {
        //Run "first command" as defined in local xml parser
        firstCommand();

        function firstCommand() {
            var command = dbCommands.firstCommand;
            self.emit('message', 'Running first mysqldump command...');
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
                        checkFileExists(dbData.filename);
                        self.once('checkFile', function(event){
                            if (event === 'success') {
                                compressFile();
                            }
                        });
                    }
                    else {
                        conn.end();
                        self.emit('error', 'mysqldump command did not exit successfully');
                    }
                });

                enterPassword(stream);
            });
        }

        function compressFile() {
            var command = util.format('gzip ~/%s', dbData.filename);
            self.emit('message', 'File compression beginning...');
            conn.connection.exec(command, function(err, stream){
                if (err) throw err;
                var returnString = '';

                stream.on('data', function(data){
                    returnString += data;
                });

                stream.on('exit', function(exitCode){
                    if (exitCode == 0) {
                        self.emit('message', 'File compression complete.');
                        downloadFile();
                    }
                    else {
                        self.emit('error', util.format('gzip returned an error while compressing dump file: %s', returnString));
                    }
                });
            });
        }

        /**
         * Performs a set of async functions which fire off events, calling the defined functions in the position
         * they appear
         */
        function downloadFile() {
            var fileSize = 0;

            self.on('fileSize', function(size){
                fileSize += parseInt(size);
                console.log('File size:', size);
                getFile();
            });

            self.on('getFile', function(fileData){
                deleteRemoteFile();
            });


            self.on('deleteFile', function(){
                self.emit('finish');
            });

            getFileSize();

            function getFileSize() {
                var command = util.format('stat -c%%s "%s"', dbData.filename + ".gz");
                conn.connection.exec(command, function(err, stream){
                    if (err) throw err;
                    var returnString = '';
                    stream.on('data', function(data){
                        returnString += data;
                    });
                    stream.on('exit', function(exitCode){
                        if (exitCode == 0) {
                            returnString = returnString.replace(/[^\d]/, '');
                            self.emit('fileSize', returnString);
                        }
                        else {
                            self.emit('error', 'Problem with stat command while trying to get file size');
                            return false;
                        }
                    });
                });
            }

            /**
             * Gets file via local SCP command, emulates PTY to parse out SCP progress
             */
            function getFile() {
                var term = pty.spawn('bash', [], {
                    name: 'xterm',
                    cols: 80,
                    rows: 30,
                    cwd: process.env.HOME,
                    env: process.env
                });

                var downloadFilePath = path.join(downloadPath, dbData.filename + ".gz");

                var command = util.format('scp %s@%s:~/%s %s',
                    siteProfile['ssh_username'],
                    siteProfile['ssh_host'],
                    dbData.filename + ".gz",
                    downloadFilePath
                );


                term.on('data', function(data) {
                    if (/ETA/.test(data)) {
                        try {
                            //var stats = {
                            //    "remaining": /\d*?:\d*?(?=\s*?ETA)/.exec(data)[0],
                            //    "rate": /\d*?\.?\d*?\w{1,2}\/s/.exec(data)[0],
                            //    "total_downloaded": /[^.]\d+?[a-zA-Z]{1,2}/.exec(data)[0].trim(),
                            //    "pct_complete": /\d+?%/.exec(data)[0]
                            //};
                            var stats = /\d+?%.*?ETA/.exec(data)[0];
                            console.log("DownloadProgress:\t\t%s", stats);
                        }
                        catch (e) {} //Ignore any regex parsing errors and continue
                    }
                });

                term.on('close', function(){
                    self.emit('message', util.format('Finished file file transfer with scp!  Total size: %sK  Path: %s',
                        Tools.number_format(fileSize / 1024),
                        downloadFilePath
                    ));
                    self.emit('getFile');
                });

                self.emit('message', 'Beginning file download with scp...');
                term.write(command + " && exit\r");
            }

            function deleteRemoteFile() {
                var command = util.format('rm -f ~/%s', dbData.filename + '.gz');
                self.emit('message', 'Deleting remote file...');
                conn.connection.exec(command, function(err, stream){
                    if (err) throw err;
                    var returnString = '';

                    stream.on('data', function(data){
                        returnString += data;
                    });

                    stream.on('exit', function(exitCode){
                        if (exitCode == 0) {
                            self.emit('message', 'Deleted remote file.');
                            self.emit('deleteFile');
                        }
                        else {
                            self.emit('error', util.format('rm returned an error while deleting remote file: %s', returnString));
                        }
                    });
                });
            }
        }

        function enterPassword(stream) {
            stream.once('data', function(data){
                var string = ''+data;
                if (string == 'Enter password: ') {
                    stream.write(dbData.password + "\n");
                }
                else {
                    self.emit('error', util.format('Error with password prompt on remote mysqldump command. %s', data));
                }
            });
        }
    }

    function checkFileExists(fileName) {
        var command = util.format('find ~/%s -type f', fileName);
        conn.connection.exec(command, function(err, stream){
            if (err) throw err;
            var returnString = '';
            stream.once('data', function(data){
                returnString = ''+data;
            });
            stream.on('end', function() {
                if (returnString) {
                    returnString = returnString.replace(/[\n\r]/g, '');
                    self.emit('message', util.format('Dump file found at: %s', returnString));
                    self.emit('checkFile', 'success');
                }
            });
            stream.on('exit', function(exitCode){

                if (exitCode !== 0) {
                    self.emit('error', util.format('Dump file not found: %s', returnString));
                }
            });
        });
    }
};

module.exports = DatabaseConnection;