var config = require('./config');
var mysql = require('mysql');
var webServer = require('./webserver');

function MyServer(){

    webServer.startServer();

//    SSHTunnel.connect(function(){
//
//        var myConn = mysql.createConnection({
//            host: config.db.host,
//            port: config.tunnel.port,
//            user: config.db.user,
//            password: config.db.password,
//            database: config.db.database
//        });
/*

        //Now we are tunneled, try to connect to mysql
        myConn.connect();

        //Test query
        myConn.query('SELECT * from core_config_data where path like "%url%"', function(err, rows, fields) {
            if (err) throw err;
            console.log(rows);
        });

*/

//    });


}

new MyServer();

