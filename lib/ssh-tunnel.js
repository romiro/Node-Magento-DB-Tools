'use strict';
var net = require('net');
var SSHConn = require('./ssh-conn');
var config = require('../config');

function SSHTunnel(options) {
    var sshConn;
    var sshOptions;

    this.newConnection = function(options) {
        sshConn = new SSHConn();
        sshOptions = options;
    };

    this.startTunnel = function(remoteHost, remotePort, callback) {
        sshConn.onReady(function(){
            console.log('SSH Connection :: ready');

            //Now that the SSH connection is established, create the server that will
            // pipe the connection. Includes callback that is called whenever something
            // connects on host:port defined below at server.listen()
            var server = net.createServer(function(sock){

                console.log('TunnelServer :: pipe created');

                //Set up the SSH forward. Perform forward in callback.
                sshConn.connection.forwardOut(sock.remoteAddress, sock.remotePort, remoteHost, remotePort, function(err, stream){
                    if (err) throw err;
//                    stream.on('data', function(data) {
//                        console.log('STREAM Data :: '+data);
//                    });
                    console.log('TunnelServer :: connection established');
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

        sshConn.connect(sshOptions);

    };
}

module.exports = SSHTunnel;
