var program = require('commander'),
    _ = require('underscore'),
    siteProfiles = require('./lib/site-profiles');

program
    .version('0.5')
    .option('--start-server', 'Start webserver using options defined in config.js')
    .option('--list-profiles', 'List configured site profiles')
    .option('--show-profile [profile name]', 'Show information stored for a given profile name')
    .option('--run-profile [profile name]', 'Run given profile')
    .option('--full-dump', 'Used with --run-profile, performs a full DB dump')
    .option('--selective-dump', 'Used with --run-profile, performs a selective table dump with default tables excluded')
    .parse(process.argv);


function MagentoDbTools(){
    if (program['startServer']) {
        var webServer = require('./webserver');
        webServer.startServer();
    }
    else if (program['listProfiles']) {
        console.log("\n\nStored Site Profiles:");
        console.log('-----------------------------');
        _.each(siteProfiles.getAll(), function(val){
            console.log("\t%s", val['profileName']);
        });
        console.log("\nExample Usage: --run-profile \"%s\"\n", siteProfiles.getAll()[0]['profileName']);
    }
    else if (program['showProfile']) {
        var profile = siteProfiles.getBy('profileName', program['showProfile']);
        if (profile) {
            console.log("\nDetails for \"%s\"", profile['profileName']);
            console.log('-----------------------------');
            console.log(profile);
        }
    }
    else if (program['runProfile']) {
        console.log("Not implemented :(");
    }
}

new MagentoDbTools();
