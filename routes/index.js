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
        resp.render('clients');
    });

    webApp.get('/Clients/getAll', function(req, resp){
        sqliteDb.Client.getAll(function(data){
            resp.json(data);
        });
    });

    webApp.post('/Clients/save', function(req, resp){
        var params = req.body;
        if (params.id) {
            sqliteDb.Client.update(params, function(){
                resp.json({});
            });
        }
        else {
            sqliteDb.Client.insert(params, function(lastId){
                resp.end();
            });
        }
    });

    webApp.post('/Clients/delete', function(req, resp){
        var id = req.body['id'];
        if (!id) {
            resp.end('Id is not set');
            return false;
        }
        sqliteDb.Client.deleteBy('id', id, function(numChanges){
            resp.end();
        });
    });

    webApp.get('/servers', function(req, resp){
        resp.render('servers');
    });

    webApp.get('/Servers/getAll', function(req, resp){
        sqliteDb.Server.getAllJoined(function(data){
            resp.json(data);
        });
    });

    //Site Profiles
    webApp.get('/profiles', function(req, resp){
        resp.render('profiles');
    });

    webApp.get('/Profiles/getAll', function(req, resp){
        resp.json(siteProfiles.getAll());
    });

    webApp.post('/Profiles/save', function(req, resp){
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

    webApp.post('/Profiles/delete', function(req, resp){
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

    webApp.get(/\/getSshConfig|\/SshConfig\/getAll/, function(req, resp){
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
