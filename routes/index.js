'use strict';

var util = require('util');

var config = require('../config');
var JsonStore = require('../lib/json-store');
var SSHConn = require('../lib/ssh-conn');
var SSHConfig = require('../lib/ssh-config-reader');
//var dbSocket = require('./sockets/db');

var dbRoutes = require('./database');

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

    var siteProfiles = webApp.locals.siteProfiles = new JsonStore('site-profiles');

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

    dbRoutes.use(webApp);


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
