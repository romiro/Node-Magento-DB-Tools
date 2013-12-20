var config = require('./config');
var net = require('net');
var Connection = require('ssh2');
var mysql = require('mysql');
var webServer = require('./lib/webserver');

var MyServer = function(){

//    startServer();

    var sshConn = new Connection();

    var myConn = mysql.createConnection({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database
    });

    startSSHTunnel(function(){
        //Now we are tunneled, try to connect to mysql
        myConn.connect();

        //And then start the web server
        webServer.startServer();

        //Test query
        myConn.query('SELECT * from core_config_data where path like "%url%"', function(err, rows, fields) {
            if (err) throw err;
            console.log(rows);
        });
    });


    /**
     * Starts the SSH connection and proxy server to route mysql through
     * Callback is executed after all is finished
     *
     * @param callback
     */
    function startSSHTunnel(callback) {
        sshConn.on('connect', function() {
            console.log('SSH Connection :: connect');
        });

        sshConn.on("ready", function(){
            console.log('SSH Connection :: ready');

            //Now that the SSH connection is established, create the server that will
            // pipe the connection. Includes callback that is called whenever something
            // connects on host:port defined below at server.listen()
            var server = net.createServer(function(sock){
                console.log('Server :: connection established');

                //Set up the SSH forward. Perform forward in callback.
                sshConn.forwardOut(sock.remoteAddress, sock.remotePort, '127.0.0.1', 3306, function(err, stream){
                    if (err) throw err;
                    sock.pipe(stream);
                    stream.pipe(sock);
                });
            });

            server.on('listening', function(){
                console.log('Server :: listening');
                if (typeof callback == 'function') callback();
            });

            console.log('Server :: listen');
            server.listen(3406);
        });
        sshConn.on('error', function(err) {
            console.log('SSH Connection :: error :: ' + err);
        });
        sshConn.on('end', function() {
            console.log('SSH Connection :: end');
        });
        sshConn.on('close', function(had_error) {
            console.log('SSH Connection :: close');
        });

        //Connect to SSH after all the events are set
        sshConn.connect({
            host: config.ssh.host,
            port: config.ssh.port,
            username: config.ssh.username,
            password: config.ssh.password
        });
    }


};

new MyServer();

