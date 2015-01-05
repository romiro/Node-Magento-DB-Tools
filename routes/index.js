'use strict';

var config = require('../config');

var SSHConn = require('../lib/ssh-conn');
var SSHConfig = require('../lib/ssh-config-reader');
var siteProfiles = require('../lib/site-profiles');
var sqliteDb = require('../db');

var dbRoutes = require('./database');


sqliteDb.connect();

function Routes() {}

Routes.prototype.use = function (webApp) {

    webApp.locals.siteProfiles = siteProfiles;

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

    webApp.get('/clients', function(req, resp){
        sqliteDb.Client.getAll(function(rows){

            resp.render('clients', {rows:rows});
        });
    });

    webApp.get('/servers', function(req, resp){
        resp.render('servers');
    });

    //Site Profiles
    webApp.get('/site-profiles', function(req, resp){
        resp.render('site-profiles');
    });

    webApp.get('/getProfiles', function(req, resp){
        resp.json(siteProfiles.getAll());
    });

    webApp.post('/saveProfile', function(req, resp){
        var sshEntry = SSHConfig.getHostByName(req.body['ssh-config-name']);
        var key = req.body['key'] ? req.body['key'] : null;
        var data = {
            profileName: req.body['profile-name'],
            sitePath: req.body['site-path'],
            sshConfigName: req.body['ssh-config-name'],
            sshHost: sshEntry['host'],
            sshUser: sshEntry['user']
        };
        siteProfiles.set(key, data);
        siteProfiles.save();
        resp.end();
    });

    webApp.post('/deleteProfile', function(req, resp){
        var key = req.body['key'];
        try {
            siteProfiles.remove(key);
        }
        catch (e) {
            resp.end(e);
        }
        resp.end();
    });

    dbRoutes.use(webApp);

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
