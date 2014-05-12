'use strict';
var config = require('../config');
var JsonStore = require('../lib/json-store');
var SSHConn = require('../lib/ssh-conn');

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

    webApp.get('/site-profiles', function(req, resp){
        resp.render('site-profiles');
    });

    var siteProfiles = new JsonStore('site-profiles');
    webApp.get('/getSiteProfiles', function(req, resp){
        resp.json(siteProfiles.get)
    });

    webApp.get('/getSshConfig', function(req, resp){
        resp.json(webApp.locals.sshConfig);
    }.bind(webApp));

    webApp.get('/connectSSH', function(req, resp){
        var conn = new SSHConn();
        conn.connect(function(){
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
