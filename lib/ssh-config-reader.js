var path = require('path');
var fs = require('fs');

function SSHConfigReader() {
    var home = getUserHome();
    var sshConfigFile = path.join(home, '.ssh', 'config');
    var contents = fs.readFileSync(sshConfigFile, {encoding: 'utf8'});

    console.log(compileEntries(contents));
}

function compileEntries(fileString) {
    var hosts = [];
    var _hosts = fileString.split(/Host /);
    var len = _hosts.length;
    for (var i = 0; i < len; i++) {
        var user = getMatch(_hosts[i], /User (.*?)\s/m);
        var host = getMatch(_hosts[i], /HostName (.*?)\s/m);
        if (user == null || host == null) {
            continue;
        }
        hosts.push({"user":user, "host":host});
    }
    return hosts;
}
function getMatch(string, regex) {
    var matches = string.match(regex);

    if (matches == null || typeof matches == 'undefined') {
        return null;
    }
    return matches[1];
}

function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

module.exports = SSHConfigReader;

if (module.parent === null) {
    new SSHConfigReader();
}