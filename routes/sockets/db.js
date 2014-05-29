var qs = require('qs');

function DatabasePageSocketHandler() {
    var webApp, io, self;
    self = this;

    this.init = function(_webApp) {
        webApp = _webApp;
        if (!webApp.locals.io) {
            throw new Error('Socket io object not defined in webapp locals object!');
        }
        io = webApp.locals.io;

        //Socket events for db page
        var databaseIo = io.of('/database'); //Use namespace
        databaseIo.on('connection', function(socket){

            console.log('db socket connect');
            socket.on('test-connection', function(data){
                var parsedData;
                if (data.data) {
                    parsedData = qs.parse(data.data);
                }
                if (!parsedData) {
                    self.sendMessage(socket, 'Error with parsed form data ');
                    return false;
                }
                self.sendMessage('Got test connect');
            });
        });
    };

    this.sendMessage = function(socket, message) {
        socket.emit('db-message', {message:message});
    };
}

module.exports = new DatabasePageSocketHandler();