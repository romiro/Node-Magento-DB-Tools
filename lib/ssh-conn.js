'use strict';
var net = require('net');
var path = require('path');
var fs = require('fs');
var Connection = require('ssh2');

var config = require('../config');
var tools = require('./tools');

function SSHConn() {

    this.connection = new Connection();

    this.onReady =  function(callback) {
        this.connection.on("ready", callback);
    };

    /**
     * Starts the SSH connection
     * Callback is executed on ready event of ssh
     *
     * @param options
     * @param callback
     */
    this.connect = function(options, callback){
        var sshOptions = {
            host: options.host,
            port: options.port,
            username: options.username
        };

        if (options.password) {
            sshOptions.password = options.password;
        }
        else {
            sshOptions.privateKey = this.getPrivateKey(config.ssh.privateKey);
            sshOptions.publicKey = this.getPublicKey(config.ssh.publicKey);
            sshOptions.passphrase = config.ssh.passphrase;
        }

        this.setupEvents();

        this.connection.on("ready", function(){
            console.log('SSH Connection :: ready');
            callback();
        });

        //Connect to SSH after all the events are set
        this.connection.connect(sshOptions);
    };

    this.getPrivateKey = function(filePath) {
        filePath = filePath ? filePath : path.join(tools.getUserHome(), '.ssh', 'id_rsa');
        return ''+fs.readFileSync(filePath);
    };

    this.getPublicKey = function(filePath) {
        filePath = filePath ? filePath : path.join(tools.getUserHome(), '.ssh', 'id_rsa.pub');
        return ''+fs.readFileSync(filePath);
    };

    this.setupEvents = function() {
        this.connection.on('connect', function() {
            console.log('SSH Connection :: connect');
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
    };
}

module.exports = SSHConn;
