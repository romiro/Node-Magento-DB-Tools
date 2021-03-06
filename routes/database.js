var util = require('util');

var sqliteDb = require('../db');
var DatabaseConnection = require('../lib/database-connection');
var config = require('../config');

/**
 * Global variable to module to ensure that even a new instance, if it were created, can't run twice
 * @type {boolean}
 */
var isRunning = false;

function DatabaseRoute() {}

DatabaseRoute.prototype.use = function(webApp) {

    //Setup default options for Run and Test requests
    var defaultOptions = {
        downloadPath: config.general.downloadPath
    };

    webApp.post('/testDatabaseConnection', function(req, resp) {
        return handleRequest(req, resp, 'test');
    });

    webApp.post('/runDatabaseConfiguration', function(req, resp){
        return handleRequest(req, resp, 'run');
    });

    function handleRequest(req, resp, type) {
        console.log('Database dump request coming in...');
        req.clearTimeout();
        req.connection.setTimeout(0);
        var returnJson = {messages:[]};

        if (isRunning) {
            returnJson['error'] = 'Dump is already running. Check log output if you think this is not the case, and restart the application if so';
            resp.json(returnJson);
            return false;
        }

        var params = req.body;
        var options = util._extend(defaultOptions);

        //Parse incoming parameters
        options.type = type;
        options.passOrKey = params['pass-or-key'];
        if (options.passOrKey == 'password') {
            options.password = params['password'];
        }

        //Set up the DB object
        var db = new DatabaseConnection();

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
            if (resp.finished !== true) {
                resp.json(returnJson);
            }
            isRunning = false;
        });

        //Get the profile from the DB and start the dump
        sqliteDb.Profile.getByJoined('Profile.id', params['profile_id'], function(data){
            options.siteProfile = data[0];
            options.ignoredTables = options.siteProfile['excluded_tables'];
            db.start(options);
        });
    }
};

module.exports = new DatabaseRoute();
