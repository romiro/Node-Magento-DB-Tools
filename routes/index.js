'use strict';

var config = require('../config');

var SSHConfig = require('../lib/ssh-config-reader');
var sqliteDb = require('../db');
var JsonStore = require('../lib/json-store');

var dbRoutes = require('./database');

var excludedTables = new JsonStore('excluded-tables').getAll();

sqliteDb.connect();

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


    /**
     * Client/Server/Profile Routes
     * (these look uglier if you removed the duplicate code in the regexes. a lot uglier.)
     */

    webApp.get(/^\/(Clients|Servers|Profiles)$/, function(req, resp){
        var viewName = req.params[0].toLowerCase();
        resp.render(viewName);
    });

    webApp.get(/^\/(Clients|Servers|Profiles)\/getAll$/, function(req, resp){
        var type = req.params[0].slice(0, -1);
        sqliteDb[type].getAllJoined(function(data){
            resp.json(data);
        });
    });

    webApp.post(/^\/(Clients|Servers|Profiles)\/delete/, function(req, resp){
        var type = req.params[0].slice(0, -1);
        var id = req.body['id'];
        if (!id) {
            resp.end('Id is not set');
            return false;
        }
        sqliteDb[type].deleteBy('id', id, function(numChanges){
            resp.end();
        });
    });

    webApp.post('/Clients/save', function(req, resp){
        var params = req.body;

        params['client_code'] = params['client_code'].toUpperCase();

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


    /**
     * Server Routes
     */

    webApp.post('/Servers/save', function(req, resp){
        var params = req.body;

        if (params['ssh_config']) {
            var sshEntry = SSHConfig.getHostByName(params['ssh_config']);
            params['ssh_host'] = sshEntry['host'];
            params['ssh_username'] = sshEntry['user'];
            delete params['ssh_config'];
        }

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

    /**
     * Profile Routes
     */

    webApp.get('/Profiles/new', function(req, resp){
        resp.render('profiles/edit', {action: 'new'});
    });

    //webApp.get(/\/Profiles\/edit\/(.*)/g , function(req, resp){
    webApp.get('/Profiles/edit/:id', function(req, resp, next){
        var id = req.params['id'];
        if (!id) next();
        sqliteDb.Profile.getByJoined('Profile.id', id, function(data){
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
    
    webApp.post('/Profiles/save', function(req, resp){
        var params = req.body;
        params['excluded_tables'] = JSON.stringify(params['excluded_tables']);
        params['profile_name'] = params['profile_name'].toLowerCase();

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
        var id = req.body['id'];

        try {
            sqliteDb.Profile.deleteBy('id', id, function(numChanges){
                resp.end();
            });
        }
        catch (e) {
            resp.send(500, e);
            resp.end(e);
        }
    });

    webApp.get("/Profiles/run/:id", function(req, resp){
        var id = req.params["id"];
        if (!id) {
            resp.render('profiles/run', {profile: null});
        }
        else {
            sqliteDb.Profile.getByJoined('Profile.id', id, function(data){
                resp.render('profiles/run', {profile: data[0]});
            });
        }
    });

    dbRoutes.use(webApp);

    webApp.get(/\/getSshConfig|\/SshConfig\/getAll/, function(req, resp){
        var filepath = process.env['CONFIG_SSH_SSHCONFIGFILE'] || config.general.sshConfigFile || false;
        resp.json(SSHConfig.getHosts(filepath));
    }.bind(webApp));

    webApp.get('/ExcludedTables/getAll', function(req, resp){
        resp.json(excludedTables);
    });

};

module.exports = new Routes();
