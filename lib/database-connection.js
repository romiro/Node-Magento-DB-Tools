var util = require('util');
var events = require("events");
var path = require('path');
var fs = require('fs');

var mysql = require('mysql');

var SSHConn = require('./ssh-conn');
var LocalXmlParser = require('./localxml-parser');
var SSHTunnel = require('./ssh-tunnel');
var config = require('../config');
var Logger = require('./logger');

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

    //Options checking
    type = options.type ? options.type : 'test';
    ignoredTables = options.ignoredTables ? options.ignoredTables : [];

    if (!options['siteProfile']) {
        self.emit('error', 'No site profile defined in options, cannot continue.');
        return false;
    }
    var siteProfile = options['siteProfile'];

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
        conn.end();
    });

    self.emit('message', util.format('STARTING NEW %s DUMP FOR [ %s - %s - %s ]',
        type.toUpperCase(),
        siteProfile['client_name'],
        siteProfile['server_name'],
        siteProfile['profile_name']
    ));

    //Check that defined downloadPath exists and is writable
    downloadPath = options.downloadPath || config.general.downloadPath;
    if (!checkDownloadPath(downloadPath)) {
        return false;
    }

    //Set up primary SSH connection
    var conn = this.conn = new SSHConn();

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

            stream.on('exit', function(exitCode){
                if (exitCode == 1) {
                    self.emit('error', util.format('Did not find local.xml at %s on server', filePath));
                }
                else if (exitCode == 0){ //File found, data should have collected into localXml

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
                //TODO: Add callback to saveToLocal() and perform a delete of the file on the remote server
                saveToLocal(fileData);
            });

            self.on('saveToLocal', function(){
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

            function getFile() {
                var command = util.format('dd if=%s bs=100k status=noxfer', dbData.filename + ".gz");
                self.emit('message', 'Download of file contents into buffer beginning...');
                conn.connection.exec(command, function(err, stream){
                    if (err) throw err;
                    var buffers = [];
                    var dataLength = 0;
                    var timeoutId;

                    stream.on('data', function(chunk){
                        console.log('Got %s bytes', chunk.length);
                        if (chunk.constructor.name == 'Buffer') {
                            buffers.push(chunk);
                            dataLength += chunk.length ? chunk.length : 0;
                        }
                    });

                    stream.on('error', function(error){
                        self.emit('error', util.format('Error with dd on remote server: %s', error));
                    });

                    stream.on('end', function(exitCode){
                        var data = Buffer.concat(buffers);
                        console.log('Buffer size:', data.length);
                        if (data.length !== fileSize) {
                            self.emit('message', util.format('WARNING: File size does not match size of internal buffer! May be issues decompressing file. file: %s, buffer: %s', fileSize, data.length));
                        }

                        self.emit('message', 'Download of file contents into buffer finished.');

                        clearTimeout(timeoutId);

                        self.emit('getFile', data);
                    });

                    timeoutId = setTimeout(function(){
                        console.log('Downloaded %s out of %s bytes...', dataLength, fileSize);
                    },5000);
                });
            }

            function saveToLocal(fileData) {
                var downloadFilePath = path.join(downloadPath, dbData.filename + ".gz");
                self.emit('message', 'Writing of buffer to disk beginning...');
                fs.writeFile(downloadFilePath, fileData, function(err){
                    if (err) throw err;
                    self.emit('message', 'Writing of buffer to disk finished.');
                    self.emit('message', util.format('Successfully downloaded file to %s!', downloadFilePath));
                    self.emit('saveToLocal');
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
                    throw new Error('Error with password prompt on remote mysqldump command');
                }
            });
        }
    }

    function checkFileExists(fileName) {
        var command = util.format('find ~/%s -type f', fileName);
        conn.connection.exec(command, function(err, stream){
            if (err) throw err;
            var returnString;
            stream.once('data', function(data){
                returnString = ''+data;
            });
            stream.on('exit', function(exitCode){
                if (exitCode == 0) {
                    self.emit('message', util.format('Dump file found at: %s', returnString));
                    self.emit('checkFile', 'success');
                }
                else {
                    self.emit('error', util.format('Dump file not found: %s', returnString));
                }
            });
        });
    }
};

module.exports = DatabaseConnection;