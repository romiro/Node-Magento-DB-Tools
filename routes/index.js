function Routes() {}

Routes.prototype.use = function(webApp) {

    webApp.get('/', function(req, resp){
        resp.render('index');
    });

    webApp.get('/configuration', function(req, resp){
        resp.render('configuration');
    });

};

module.exports = new Routes();
