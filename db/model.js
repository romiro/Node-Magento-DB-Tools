var util = require('util');

function Model(db) {
    this.db = db;
}

Model.prototype.getAll = function(callback) {
    var conn = this.db.connection;
    var self = this;
    conn.serialize(function(){
        conn.all(util.format('SELECT * FROM %s', self.tableName), function(err, rows){
            if (err) throw err;
            callback(rows);
        });
    });
};

module.exports = Model;