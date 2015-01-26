'use strict';

var config = require('../config');

var SSHConfig = require('../lib/ssh-config-reader');
var siteProfiles = require('../lib/site-profiles');
var sqliteDb = require('../db');
var JsonStore = require('../lib/json-store');

var dbRoutes = require('./database');

var excludedTables = new JsonStore('excluded-tables').getAll();

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


    /**
     * Client Routes
     */
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
            delete params['id'];
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


    /**
     * Server Routes
     */
    webApp.get('/servers', function(req, resp){
        resp.render('servers');
    });

    webApp.get('/Servers/getAll', function(req, resp){
        sqliteDb.Server.getAllJoined(function(data){
            resp.json(data);
        });
    });

    webApp.post('/Servers/save', function(req, resp){
        var params = req.body;
        var sshEntry = SSHConfig.getHostByName(params['ssh_config']);
        params['ssh_host'] = sshEntry['host'];
        params['ssh_username'] = sshEntry['user'];
        delete params['ssh_config'];
        if (params.id) {
            sqliteDb.Server.update(params, function(){
                resp.json({});
            });
        }
        else {
            delete params['id'];
            sqliteDb.Server.insert(params, function(lastId){
                resp.end();
            });
        }
    });

    webApp.post('/Servers/delete', function(req, resp){
        var id = req.body['id'];
        if (!id) {
            resp.end('Id is not set');
            return false;
        }
        sqliteDb.Server.deleteBy('id', id, function(numChanges){
            resp.end();
        });
    });

    /**
     * Profile Routes
     */
    webApp.get('/profiles', function(req, resp){
        resp.render('profiles/index');
    });

    webApp.get('/Profiles/new', function(req, resp){
        resp.render('profiles/edit', {action: 'new'});
    });

    webApp.get(/\/Profiles\/edit\/(.*)/g , function(req, resp){
        sqliteDb.Profile.getByJoined('Profile.id', req.route.params[0], function(data){
            resp.render('profiles/edit', {action: 'edit', profile: data[0]});
        });

    });

    webApp.get('/Profiles/get', function(req, resp){
        var params = req.body;

        if (params.id) {
            sqliteDb.Profile.getByJoined('id', params.id, function(data){
                resp.json(data);
            });
        }
    });

    webApp.get('/Profiles/getAll', function(req, resp){
        sqliteDb.Profile.getAllJoined(function(data){
            resp.json(data);
        });
    });

    webApp.post('/Profiles/save', function(req, resp){
        var params = req.body;
        params['excluded_tables'] = JSON.stringify(params['excluded_tables']);

        if (params.id) {
            sqliteDb.Profile.update(params, function(){
                resp.json({});
            });
        }
        else {
            //Inserting default list of tables for now - will get tables from server in later release
            params['tables'] = JSON.stringify(excludedTables);

            sqliteDb.Profile.insert(params, function(lastId){
                resp.end();
            });
        }
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

    webApp.get('/ExcludedTables/getAll', function(req, resp){
        resp.json(excludedTables);
    });

};

module.exports = new Routes();
