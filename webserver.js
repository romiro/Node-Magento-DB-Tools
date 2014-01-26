var express = require('express');
var http = require('http');
var socketIo = require('socket.io');
var engine = require('ejs-locals');

var SSHTunnel = require('./lib/ssh-tunnel');
var routes = require('./routes');
var config = require('./config');
var sshConfigReader = require('./lib/ssh-config-reader');

function WebServer() {
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
    webApp.locals.sshConfig = sshConfigReader.getHosts();


    webApp.engine('ejs', engine);
    webApp.set('view engine', 'ejs');
    webApp.set('views', __dirname + '/views');
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

    this.startServer = function() {
        webApp.listen(config.web.port);
        console.log('Web server now listening for connections on '+config.web.port);
    };

    function respNotFound(request, response) {
        response.writeHead(404);
        response.end("Woah! 404!");
    }
}

module.exports = new WebServer();

if (module.parent === null) {
    module.exports.startServer();
}