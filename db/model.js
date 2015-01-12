var util = require('util');
var _ = require('underscore');

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


Model.prototype.insert = function(data, callback) {
    var conn = this.db.connection;

    if (data['id'] === '') {
        delete data['id'];
    }

    var statement = util.format('INSERT INTO %s (%s) VALUES (%s);',
        this.tableName,
        _.keys(data).join(','),
        _.chain(data).values(data).map(function(val){ return '"'+val+'"' }).join(',').value()
    );

    conn.serialize(function(){
        conn.run(statement, function(err){
            if (err) throw err;
            callback(this.lastID);
        });
    });
};

Model.prototype.update = function(data, callback) {
    var conn = this.db.connection;

    if (typeof data['id'] === 'undefined') {
        throw new Error('Invalid use of Model.update - record must have an existing ID');
    }

    var id = data['id'];
    delete data['id'];

    var statement = util.format('UPDATE %s SET %s WHERE %s.id = %s',
        this.tableName,
        _.chain(data)
            .map(function(val, key){
                return util.format('%s = "%s"', key, val)
            }).join(',')
        .value(),
        this.tableName,
        id
    );

    conn.serialize(function(){
        conn.run(statement, function(err){
            if (err) throw err;
            callback(this.changes);
        });
    });
};

module.exports = Model;