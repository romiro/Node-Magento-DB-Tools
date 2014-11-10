var util = require('util');
var events = require("events");
var path = require('path');
var fs = require('fs');

var mysql = require('mysql');

var SSHConn = require('../lib/ssh-conn');
var SSHConfig = require('../lib/ssh-config-reader');


var DatabaseConnection = require('../lib/database-connection');
var config = require('../config');

var siteProfiles;

function DatabaseRoute() {}

DatabaseRoute.prototype.use = function(webApp) {

    var defaultOptions = {
        downloadPath: config.general.downloadPath
    };

    siteProfiles = webApp.locals.siteProfiles;

    defaultOptions.siteProfile = siteProfiles.get(req.body['site-profile']);

    //Auto DB Sanitizer & Downloader
    webApp.get('/database', function(req, resp){
        resp.render('database');
    });

    webApp.post('/testDatabaseConnection', function(req, resp) {
        var options = util._extend(defaultOptions);
        options.type = 'test';
        options.passOrKey = req.body['pass-or-key'];
        options.password = req.body['password'];
        options.ignoredTables = req.body['tables'];

        var db = new DatabaseConnection();
        var returnJson = {messages:[]};

        db.on('error', function(error){
            console.log('ERROR EVENT: %s', error);
            returnJson['error'] = error;
            resp.json(returnJson);
        });

        db.on('message', function(message){
            console.log(message);
            returnJson.messages.push(message);
        });

        db.on('finish', function(){
            db.conn.end();
            resp.json(returnJson);
        });

        db.start(options);
    });

    webApp.post('/runDatabaseConfiguration', function(req, resp){
        var options = util._extend(defaultOptions);
        options.type = 'run';
        options.passOrKey = req.body['pass-or-key'];
        options.password = req.body['password'];
        options.ignoredTables = req.body['tables'];

        var db = new DatabaseConnection();
        var returnJson = {messages:[]};

        db.on('error', function(error){
            returnJson['error'] = error;
            resp.json(returnJson);
        });

        db.on('message', function(message){
            returnJson.messages.push(message);
        });

        db.on('finish', function(){
            resp.json(returnJson);
        });

        db.start(options);
    });

};

module.exports = new DatabaseRoute();
