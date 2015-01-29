var util = require('util');

var sqliteDb = require('../db');
var DatabaseConnection = require('../lib/database-connection');
var config = require('../config');

function DatabaseRoute() {}

DatabaseRoute.prototype.use = function(webApp) {

    //Setup default options for Run and Test requests
    var defaultOptions = {
        downloadPath: config.general.downloadPath
    };

    webApp.post('/testDatabaseConnection', function(req, resp) {
        handleRequest(req, resp, 'test');
    });

    webApp.post('/runDatabaseConfiguration', function(req, resp){
        resp.json({error:'Not yet'});
        return false;
        handleRequest(req, resp, 'run');
    });

    function handleRequest(req, resp, type) {
        var params = req.body;
        var options = util._extend(defaultOptions);
        var siteProfile;

        //Parse incoming parameters
        options.type = type;
        options.passOrKey = params['pass-or-key'];
        if (options.passOrKey == 'password') {
            options.password = params['password'];
        }

        //Set up the DB object
        var db = new DatabaseConnection();
        var returnJson = {messages:[]};

        db.on('error', function(error){
            returnJson['error'] = error;
            console.log('DatabaseConnection ERROR :: ' + error);
            resp.json(returnJson);
        });

        db.on('message', function(message){
            console.log('DatabaseConnection :: ' + message);
            returnJson.messages.push(message);
        });

        db.on('finish', function(){
            console.log('DatabaseConnection :: FINISH');
            resp.json(returnJson);
        });

        //Get the profile from the DB and start the dump
        sqliteDb.Profile.getByJoined('id', params['profile_id'], function(data){
            options.siteProfile = data;
            db.start(options);
        });
    }
};

module.exports = new DatabaseRoute();
