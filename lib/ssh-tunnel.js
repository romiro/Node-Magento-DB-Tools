var net = require('net');
var Connection = require('./ssh-conn');

function SSHTunnel(options) {
    var sshConn = new Connection();


    this.connect = function() {
        sshConn.connect({
            host: config.ssh.host,
            port: config.ssh.port,
            username: config.ssh.username,
            password: config.ssh.password
        });
    };

    this.startTunnel = function() {
        sshConn.on('ready', function(){
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
    };
}

module.exports = SSHTunnel;
