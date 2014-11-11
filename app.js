var program = require('commander'),
    webServer = require('./webserver');

program
    .version('0.5')
    .option('--start-server', 'Start webserver using options defined in config.js')
    .option('--list-profiles', 'List configured site profiles')
    .option('--run-profile [profile name]', 'Run given profile')
    .option('--full-dump', 'Used with --run-profile, performs a full DB dump')
    .option('--selective-dump', 'Used with --run-profile, performs a selective table dump with default tables excluded');

function MagentoDbTools(){
    webServer.startServer();
}

new MagentoDbTools();

