var net = require('net');
var config = require('../config');
var Connection = require('ssh2');



function SSHConn() {

    this.connection = new Connection();

    this.onReady =  function(callback) {
        this.connection.on("ready", callback);
    };

    /**
     * Starts the SSH connection and proxy server to route mysql through
     * Callback is executed after all is finished
     *
     * @param callback
     */
    this.connect = function(callback){

        this.connection.on('connect', function() {
            console.log('SSH Connection :: connect');
        });

        this.connection.on("ready", function(){
            console.log('SSH Connection :: ready');
            callback();
        });
        this.connection.on('data', function(data) {
            console.log('SSH Connection :: data: ' + data);
        });
        this.connection.on('error', function(err) {
            console.log('SSH Connection :: error :: ' + err);
        });
        this.connection.on('end', function() {
            console.log('SSH Connection :: end');
        });
        this.connection.on('close', function(had_error) {
            console.log('SSH Connection :: close');
        });

        //Connect to SSH after all the events are set
        this.connection.connect({
            host: config.ssh.host,
            port: config.ssh.port,
            username: config.ssh.username,
            password: config.ssh.password
        });
    };
}

module.exports = SSHConn;
