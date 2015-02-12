'use strict';

var http = require('http');
var util = require('util');

var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var engine = require('ejs-locals');

var routes = require('./routes/index');
var config = require('./config');


function WebServer() {

    var webApp = this.webApp = express();
    var server = http.createServer(webApp);


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
    webApp.use(logger('combined'));
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