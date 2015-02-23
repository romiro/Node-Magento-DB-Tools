'use strict';

var http = require('http');
var util = require('util');

var express = require('express');
var expressLogger = require('morgan');
var bodyParser = require('body-parser');
var timeout = require('connect-timeout');
var engine = require('ejs-locals');

var Logger = require('./lib/logger');
var routes = require('./routes/index');
var config = require('./config');


function WebServer() {

    var webApp = this.webApp = express();
    var server = http.createServer(webApp);
    server.timout = 86400000; //Hopefully a database won't take a day to download

    var myLogger = new Logger('http.log').init();

    //Local variables configuration
    webApp.locals.config = config;
    webApp.locals.title = 'Magento MySQL Database Multi-Tool';
    webApp.locals.shortTitle = 'Magento DB Tools';
    webApp.locals.util = util;

    //Views setup
    webApp.engine('ejs', engine);
    webApp.set('view engine', 'ejs');
    webApp.set('views', __dirname + '/views');
    webApp.disable('view cache');


    //Routing chain
    webApp.use(timeout(0));
    webApp.use(expressLogger('combined', {stream: myLogger.stream}));
    webApp.use(bodyParser.json());
    webApp.use(bodyParser.urlencoded({extended: true}));

    routes.use(webApp);

    webApp.use(express.static(__dirname + '/public'));

    webApp.use(respNotFound);

    //End routing chain


    this.startServer = function(port) {
        port = port || config.web.port;
        server.listen(port);
        console.log('Web server now listening for connections on '+port);
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