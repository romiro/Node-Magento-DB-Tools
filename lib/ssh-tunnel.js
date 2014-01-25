var net = require('net');
var config = require('../config');
var Connection = require('ssh2');


function SSHTunnel() {
    this.sshConn = 'bleh';
}

/**
 * Starts the SSH connection and proxy server to route mysql through
 * Callback is executed after all is finished
 *
 * @param callback
 */
SSHTunnel.prototype.connect = function(callback){

    var sshConn = new Connection();
    this.sshConn = sshConn;

    sshConn.on('connect', function() {
        console.log('SSH Connection :: connect');
    });

    sshConn.on("ready", function(){
        console.log('SSH Connection :: ready');

        //Now that the SSH connection is established, create the server that will
        // pipe the connection. Includes callback that is called whenever something
        // connects on host:port defined below at server.listen()
        var server = net.createServer(function(sock){
            console.log('TunnelServer :: connection established');

            //Set up the SSH forward. Perform forward in callback.
            sshConn.forwardOut(sock.remoteAddress, sock.remotePort, '127.0.0.1', 3306, function(err, stream){
                if (err) throw err;
                stream.on('data', function(data) {
                    console.log('STREAM Data :: '+data);
                });
                sock.pipe(stream);
                stream.pipe(sock);
            });
        });

        server.on('listening', function(){
            console.log('TunnelServer :: listening');
            if (typeof callback == 'function') callback(this);
        });

        console.log('TunnelServer :: listen');
        server.listen(config.tunnel.port);
    });
    sshConn.on('data', function(data) {
        console.log('SSH Connection :: data: ' + data);
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
};


module.exports = SSHTunnel;