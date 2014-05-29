var path = require('path');
var fs = require('fs');
var tools = require('./tools');

var hosts;

var getHosts = exports.getHosts = function(filepath) {
    if (!hosts) {
        var sshConfigFile = filepath ? path.normalize(filepath) : path.join(tools.getUserHome(), '.ssh', 'config');
        var contents = fs.readFileSync(sshConfigFile, {encoding: 'utf8'});
        hosts = compileEntries(contents);
    }
    return hosts;
};

exports.getHostByName = function(name) {
    if (!hosts) {
        getHosts();
    }
    for (var i = 0; i < hosts.length; i++) {
        if (hosts[i]['label'] == name) {
            return hosts[i];
        }
    }
    return false;
};

function compileEntries(fileString) {
    var hosts = [];
    var _hosts = fileString.split(/Host /);
    var len = _hosts.length;
    for (var i = 0; i < len; i++) {
        var label = getMatch(_hosts[i], /^(.*?)[\n\r]/);
        var user = getMatch(_hosts[i], /User (.*?)\s/m);
        var host = getMatch(_hosts[i], /HostName (.*?)\s/m);
        if (user == null || host == null) {
            continue;
        }
        hosts.push({"label":label,"user":user, "host":host});
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
