'use strict';

var util = require('util');

var config = require('../config');
var JsonStore = require('../lib/json-store');
var SSHConn = require('../lib/ssh-conn');
var SSHConfig = require('../lib/ssh-config-reader');

function Routes() {}

Routes.prototype.use = function (webApp) {

    webApp.get('/', function(req, resp){
        resp.render('index');
    });

    webApp.get('/configuration', function(req, resp){
        resp.render('configuration');
    });

    webApp.get('/getConfig', function(req, resp) {
        resp.json(config);
    });

    webApp.post('/setConfig', function(req, resp) {
        for (var group in req.body) {
            if (req.body.hasOwnProperty(group)) {
                for (var key in req.body[group]) {
                    if (req.body[group].hasOwnProperty(key)) {
                        config[group][key] = req.body[group][key];
                    }
                }
            }
        }
    });

    //Site Profiles
    webApp.get('/site-profiles', function(req, resp){
        resp.render('site-profiles');
    });

    var siteProfiles = new JsonStore('site-profiles');
    webApp.get('/getSiteProfiles', function(req, resp){
        resp.json(siteProfiles.getAll());
    });

    webApp.post('/saveSiteProfile', function(req, resp){
        var key = req.body['key'] ? req.body['key'] : null;
        var data = {
            profileName: req.body['profile-name'],
            sitePath: req.body['site-path'],
            sshConfigName: req.body['ssh-config-name']
        };
        siteProfiles.set(key, data);
        siteProfiles.save();
        resp.end();
    });

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

        //Attempt a connect, pass error if no go
        var conn = new SSHConn();
        conn.onReady(function(){
            //Confirm directory defined in siteProfile exists

            var command = util.format('cd %s', siteProfile['sitePath']);
//            var command = util.format('cd %s', '/asdasd/asdasd/asdasd');
            conn.connection.exec(command, function(err, stream){
                if (err) {
                    console.log(err);
                    resp.end(err);
                }
                stream.on('exit', function(exitCode){
                    if (exitCode == 1) {
                        returnJson['message'] = util.format('Directory %s does not exist on server', siteProfile['sitePath']);
                        resp.json(returnJson);
                    }
                    else {
                        checkMysqldump();
                    }
                });
            });


        });

        //Determine that mysqldump command is available
        function checkMysqldump() {
            conn.connection.exec('mysqldump', function(err, stream){
                if (err) {
                    console.log(err);
                    resp.end(err);
                }
                stream.on('data', function(data){
                    console.log('DATA', ''+data);
                });
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

        conn.connect(sshOptions);

    });

    //Pass handling to other module in my crazy unpatterned way
//    var dbSocketHandler = require('./sockets/db');
//    dbSocketHandler.init(webApp);

    webApp.get('/getSshConfig', function(req, resp){
        resp.json(SSHConfig.getHosts());
    }.bind(webApp));

    //Testing action
    webApp.get('/connectSSH', function(req, resp){
        var conn = new SSHConn();
        conn.connect(config.ssh, function(){
            conn.connection.exec('who', function(err, stream){
                var out = '';
                stream.on('data', function(data, extended){
                    out += data;
                });
                stream.on('exit', function(){
                    resp.end(out);
                    conn.connection.end();
                })
            });
        });
    });


};

module.exports = new Routes();
