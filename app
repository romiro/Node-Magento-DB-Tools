#!/usr/bin/env node
try {
    require('./config');
}
catch (e) {
    if (e['code'] == 'MODULE_NOT_FOUND') {
        console.log('config.js not found in the root directory. Please rename config.js.sample to config.js and configure as needed, and try again.');
    }
    process.exit();
}

require('./lib/cli');

