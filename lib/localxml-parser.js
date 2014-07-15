var util = require('util');
var libxmljs = require('libxmljs');
var _ = require('underscore');

function LocalXmlParser(options) {
    var host, username, password, dbname, data;
    var firstTemplate, secondTemplate, fullDumpTemplate;
    var ignoredTables = [];
    var dumpDirectory = '';

    if (options) {
        if (options.dumpDirectory) {
            dumpDirectory = options.dumpDirectory;
            if (dumpDirectory.substr(-1) != '/') {
                dumpDirectory += '/';
            }
        }
    }

    firstTemplate = util.format('mysqldump --skip-lock-tables --single-transaction -d -h{{host}} -u{{username}} -p {{dbname}} > %s{{filename}}', dumpDirectory);

    secondTemplate = function(){
        var string = 'mysqldump --skip-lock-tables --single-transaction -h{{host}} -u{{username}} -p';

        _.each(ignoredTables, function(value){
            string += ' --ignore-table={{table_prefix}}{{dbname}}.' + value;
        });
        string += util.format(" {{dbname}} >> %s{{filename}}", dumpDirectory);
        return string;
    };

    fullDumpTemplate = util.format('mysqldump --skip-lock-tables --single-transaction -h{{host}} -u{{username}} -p {{dbname}} | gzip -c | cat > %s{{filename}}.gz', dumpDirectory);

    this.commands = {};

    /**
     * Sets private var for ignored tables
     * @param tables
     */
    this.setIgnoredTables = function(tables) {
        ignoredTables = tables;
    };

    /**
     * Parse local xml using libxmljs and xpath
     *
     * @param localXml
     */
    this.parse = function(localXml) {
        var xmlDoc = libxmljs.parseXml(localXml);

        var tablePrefix = xmlDoc.get('//db/table_prefix').text();

        var dbNode = xmlDoc.get('//resources/default_setup/connection');
        var dbName = dbNode.get('//dbname').text();
        var filename = dbName + "-" + getDate() + ".sql";

        this.data = data = {
            host: dbNode.get('host').text(),
            username: dbNode.get('username').text(),
            password: dbNode.get('password').text(),
            dbname: dbName,
            table_prefix: tablePrefix,
            filename: filename
        };

        this.commands = {
            firstCommand: template(firstTemplate, data),
            secondCommand: template(secondTemplate, data),
            fullDumpCommand: template(fullDumpTemplate, data)
        };

        return {data: this.data, commands: this.commands};
    };

    function template(_template, data) {
        var string = (typeof _template == 'function') ? _template() : _template;
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var re = new RegExp("{{"+key+"}}", "gi");
                string = string.replace(re, data[key]);
            }
        }
        return string;
    }

    function getDate() {
        var date = new Date();
        var month = (date.getMonth() + 1).toPrecision();
        var day = date.getDate().toPrecision();
        var string = '';

        string += date.getFullYear();
        string += month.length == 1 ? "0" + month : month;
        string += day.length == 1 ? "0" + day : day;
        return string;
    }
}

module.exports = LocalXmlParser;