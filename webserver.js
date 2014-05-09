var express = require('express');
var http = require('http');
var engine = require('ejs-locals');

var SSHTunnel = require('./lib/ssh-tunnel');
var SSHConfigReader = require('./lib/ssh-config-reader');
var routes = require('./routes');
var config = require('./config');


function WebServer() {

    var webApp = express();

    //Local variables configuration
    webApp.locals.config = config;
    webApp.locals.title = 'Magento MySQL Database Multi-Tool';
    webApp.locals.shortTitle = 'Magento DB Tools';
    webApp.locals.sshConfig = SSHConfigReader.getHosts();


    //Variables for use in request responses
    webApp.sshTunnel = SSHTunnel;


    //Views setup
    webApp.engine('ejs', engine);
    webApp.set('view engine', 'ejs');
    webApp.set('views', __dirname + '/views');
    webApp.disable('view cache');


    //Routing chain
    webApp.use(express.logger());
    webApp.use(express.bodyParser());

    routes.use(webApp);

    webApp.use(express.static(__dirname + '/public'));

    webApp.use(respNotFound);

    //End routing chain


    this.startServer = function() {
        webApp.listen(config.web.port);
        console.log('Web server now listening for connections on '+config.web.port);
    };

    function respNotFound(req, resp) {
        resp.status(404);
        resp.render('errors/404');
        resp.end();
    }
}

module.exports = new WebServer();

if (module.parent === null) {
    module.exports.startServer();
}