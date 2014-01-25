var express = require('express');
var routes = require('./routes');
var http = require('http');
var socketIo = require('socket.io');

var config = require('./config');

var responses = {
    "getConfig": function(req, resp) {
        resp.end(JSON.stringify(config));
    },
    "setConfig": function(req, resp) {
        console.log(req.data);
    }
};

var webApp = express();
var ioServer = http.createServer(webApp);
var io = socketIo.listen(ioServer);

webApp.locals.config = config;
webApp.locals.title = 'Magento MySQL Database Multi-Tool';
webApp.locals.shortTitle = 'Magento DB Tools';

webApp.set('views', __dirname + '/views');
webApp.set('view engine', 'ejs');
webApp.disable('view cache');

webApp.use(express.logger());

//Index action
webApp.get('/', function(req, resp){
    resp.render('index');
});

//Static file router
webApp.use(express.static(__dirname + '/public'));

//Web request action handlers for simple responses
for (var key in responses) {
    webApp.get("/" + key, responses[key]);
}

//Last available response sends a 404
webApp.use(respNotFound);

exports.startServer = webApp.startServer = function() {
    webApp.listen(config.web.port);
    console.log('Web server now listening for connections on '+config.web.port);
};

function respNotFound(request, response) {
    response.writeHead(404);
    response.end("Woah! 404!");
}

if (module.parent === null) {
    webApp.startServer();
}

module.exports = webApp;
