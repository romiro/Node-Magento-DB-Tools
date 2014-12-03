var util = require('util'),
    program = require('commander'),
    _ = require('underscore'),

    siteProfiles = require('./site-profiles'),
    SSHConfig = require('../lib/ssh-config-reader'),
    DatabaseConnection = require('../lib/database-connection'),
    JsonStore = require('./json-store');

program
    .version('0.5')
    .option('--start-server', 'Start web server using options defined in config.js')
    .option('   --port [port]', 'Used with --start-server, port that web server will listen on. Defaults to config.js value')
    .option('')
    .option('--list-profiles', 'List configured site profiles')
    .option('--show-profile [profile name]', 'Show information stored for a given profile name')
    .option('--test-profile [profile name]', 'Test run for given profile')
    .option('--run-profile [profile name]', 'Run given profile, defaulting to full dump')
    .option('   --selective-dump', 'Optional, used with --run-profile, performs a selective table dump excluding tables in lib/storage/excluded-tables.json')
    .parse(process.argv);


function MagentoDbTools(){

    function startServer() {
        var webServer = require('../webserver');
        var port;
        if (program['port']) {
            port = program['port'];
        }
        webServer.startServer(port);
    }

    function listProfiles() {
        console.log("\n\nStored Site Profiles:");
        console.log('-----------------------------');
        _.each(siteProfiles.getAll(), function(val){
            console.log("\t%s", val['profileName']);
        });
        console.log("\nExample Usage: --run-profile \"%s\"\n", siteProfiles.getAll()[0]['profileName']);
    }

    function showProfiles() {
        var profile = siteProfiles.getBy('profileName', program['showProfile']);
        if (profile) {
            console.log("\nDetails for \"%s\"", profile['profileName']);
            console.log('-----------------------------');
            console.log(profile);
        }
    }

    function runProfile() {
        initProfile('run');
    }

    function testProfile() {
        initProfile('test');
    }

    function initProfile(type) {
        var options = {
            type: type
        };

        if (program['selectiveDump']) {
            options.ignoredTables = new JsonStore('excluded-tables').getAll();
        }

        var profile = siteProfiles.getBy('profileName', program['runProfile']);
        options.siteProfile = profile;
        options.sshConfig = SSHConfig.getHostByName(profile.sshConfigName);

        var db = new DatabaseConnection();
        db.on('error', function(error){
            console.log('ERROR EVENT: %s', error);
            process.exit();
        });

        db.on('message', function(message){
            console.log(message);
        });

        db.on('finish', function(){
            db.conn.end();
            process.exit();
        });
        db.start(options);
    }

    //Options checking
    if (program['startServer']) {
        startServer();
    }
    else if (program['listProfiles']) {
        listProfiles();
    }
    else if (program['showProfile']) {
        showProfiles();
    }
    else if (program['testProfile']) {
        testProfile();
    }
    else if (program['runProfile']) {
        runProfile();
    }
    else {
        program.help();
    }
}

module.exports = new MagentoDbTools();
