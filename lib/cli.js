var fs = require('fs'),
    program = require('commander'),
    _ = require('underscore'),
    sprintf = require('sprintf-js').sprintf,

    tools = require('./tools'),
    sqliteDb = require('../db'),
    DatabaseConnection = require('../lib/database-connection');

program
    .version('0.5')
    .option('--start-server', 'Start web server using options defined in config.js')
    .option('   --port [port]', 'Used with --start-server, port that web server will listen on. Defaults to config.js value')
    .option('')
    .option('--list-profiles', 'List configured site profiles')
    .option('--show-profile [profile id]', 'Show information stored for a given profile name')
    .option('  --full', 'Used with --show-profile to show extended information')
    .option('')
    .option('--run-profile [profile id]', 'Run given profile, defaulting to full dump')
    .option('   --selective-dump', 'Optional, used with --run-profile, performs a selective table dump excluding tables in lib/storage/excluded-tables.json')
    .option('--test-profile [profile id]', 'Test run for given profile')
    .option('')
    .option('--setup-db', 'Run the scripts to initialize the Sqlite3 database')

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
        sqliteDb.connect();
        var format = '%4s   %-30s %-36s %-36s';
        sqliteDb.Profile.getAllJoined(function(data){

            console.log("\n\nStored Site Profiles:");
            console.log(sprintf("%'-114s", ''));
            console.log(sprintf(format, 'id', 'client', 'server', 'profile'));
            console.log(sprintf("%'-114s", ''));

            _.each(data, function(val){
                console.log(sprintf(format, val['id'], val['client_name'], val['server_name'], val['profile_name']));
            });
            console.log("\nExample Usage: --run-profile %s\n", data[0]['id']);
            process.exit();
        });
    }

    function showProfile() {
        sqliteDb.connect();
        var id = program['showProfile'];
        if (!tools.isNumeric(id)) {
            console.log("\nParameter must be a numeric id");
            return false;
        }
        var full = program['full'] ? true : false;
        sqliteDb.Profile.getByJoined('Profile.id', id, function(data){

            var profile = data[0];
            if (profile) {
                console.log("\nDetails for \"%s\"", profile['profile_name']);
                console.log('-----------------------------');
                _.each(profile, function(val, key){
                    if (!full && ['excluded_tables', 'tables', 'client_id', 'server_id'].indexOf(key) > -1) return;
                    console.log(sprintf('%12s   %-60s', key, val));
                });
                console.log("");
            }
            else {
                console.log("\nProfile with id %s not found", id);
            }

            process.exit();
        });
    }

    function runProfile() {
        initProfile('run', program['runProfile']);
    }

    function testProfile() {
        initProfile('test', program['testProfile']);
    }

    function initProfile(type, id) {
        var options = {
            type: type
        };
        var DatabaseConnection = require('../lib/database-connection');
        var profile, id;

        sqliteDb.connect();


        if (!tools.isNumeric(id)) {
            console.log("\nParameter must be a numeric id");
            return false;
        }

        sqliteDb.Profile.getByJoined('Profile.id', id, function(data){
            profile = data[0];

            if (program['selectiveDump']) {
                options.ignoredTables = profile['excluded_tables'];
            }
            options.siteProfile = profile;

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
        });
    }

    function setupDb() {
        var setup = require('../db/setup');
        var dbFileName = 'db/storage/main.sqlite';
        fs.open(dbFileName, 'r', function(err, fd){
            if (!fd && err.code == 'ENOENT') {
                setup(function(){
                    console.log('Database setup completed');
                    process.exit();
                });
            }
            else {
                console.log('\n  %s already exists! Please delete it to install a fresh database.\n', dbFileName);
            }
        });

    }

    //Options checking
    if (program['startServer']) {
        startServer();
    }
    else if (program['listProfiles']) {
        listProfiles();
    }
    else if (program['showProfile']) {
        showProfile();
    }
    else if (program['testProfile']) {
        testProfile();
    }
    else if (program['runProfile']) {
        runProfile();
    }
    else if (program['setupDb']) {
        setupDb();
    }
    else {
        program.help();
    }
}

module.exports = new MagentoDbTools();
