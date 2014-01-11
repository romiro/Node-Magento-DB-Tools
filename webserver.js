var express = require('express');
var routes = require('./routes');

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

webApp.locals.config = config;
webApp.locals.title = 'Magento MySQL Database Multi-Tool';

webApp.set('views', __dirname + '/views');
webApp.set('view engine', 'ejs');

webApp.use(express.logger());
webApp.use(express.static(__dirname + '/public'));

webApp.get('/', function(req, resp){
    resp.render('index');
});

//Web request action handlers for simple responses
for (var key in responses) {
    webApp.get("/" + key, responses[key]);
}

//Last available response sends a 404
webApp.use(respNotFound);

exports.startServer = function() {
    webApp.listen(config.web.port);
    console.log('Web server now listening for connections on '+config.web.port);
};

function respNotFound(request, response) {
    response.writeHead(404);
    response.end("Woah! 404!");
}
