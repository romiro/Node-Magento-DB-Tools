var express = require('express');
var config = require('../config');

var webApp;

function WebServer() {}

WebServer.startServer = function() {
    webApp = express();
    webApp.use(express.logger());
    webApp.use(express.static(__dirname + '/../public'));
    webApp.use(respNotFound);

    webApp.listen(config.web.port);
    console.log('Web server now listening for connections on '+config.web.port);
};

function respNotFound(request, response) {
    response.writeHead(404);
    response.end("Woah! 404!");
}

module.exports = WebServer;