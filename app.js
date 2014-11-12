var program = require('commander'),
    _ = require('underscore');

program
    .version('0.5')
    .option('--start-server', 'Start webserver using options defined in config.js')
    .option('--list-profiles', 'List configured site profiles')
    .option('--run-profile [profile name]', 'Run given profile')
    .option('--full-dump', 'Used with --run-profile, performs a full DB dump')
    .option('--selective-dump', 'Used with --run-profile, performs a selective table dump with default tables excluded')
    .parse(process.argv);


function MagentoDbTools(){
    if (program.startServer) {
        var webServer = require('./webserver');
        webServer.startServer();
    }
    else if (program.listProfiles) {
        var siteProfiles = require('./lib/site-profiles').getAll();
        console.log("\n\nStored Site Profiles:\n-----------------------------");
        _.each(siteProfiles, function(val){
            console.log("\t%s", val['profileName']);
        });
        console.log("\nExample Usage: --run-profile \"%s\"\n", siteProfiles[0]['profileName']);
    }
    else if (program.runProfile) {
        console.log("Not implemented :(");
    }
}

new MagentoDbTools();
