var util = require('util');
var _ = require('underscore');

function Model(db) {
    this.db = db;
    this.joinStatement = '';
    this.sanitizer = /["\\]/ig;
}

Model.prototype.sanitize = function(value) {
    if (typeof value !== 'string') {
        value = String(value);
    }
    return value.replace(this.sanitizer, '');
};

Model.prototype.getAll = function(callback) {
    var conn = this.db.connection;
    var statement = util.format('SELECT * FROM %s', this.tableName);

    conn.serialize(function(){
        conn.all(statement, function(err, rows){
            if (err) throw err;
            callback(rows);
        });
    });
};

Model.prototype.getBy  = function(column, search, callback){
    var conn = this.db.connection;

    var statement = util.format('SELECT * FROM %s WHERE %s="%s"',
        this.tableName,
        column,
        this.sanitize(search));

    conn.serialize(function(){
        conn.all(statement, function(err, rows){
            if (err) throw err;
            callback(rows);
        });
    });
};

Model.prototype.insert = function(data, callback) {
    var conn = this.db.connection;
    var self = this;

    if (data['id'] === '') {
        delete data['id'];
    }

    var statement = util.format('INSERT INTO %s (%s) VALUES (%s);',
        this.tableName,
        _.keys(data).join(','),
        _.chain(data).values(data).map(function(val){ return '"'+ self.sanitize(val) +'"' }).join(',').value()
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
    var self = this;

    if (typeof data['id'] === 'undefined') {
        throw new Error('Invalid use of Model.update - object must have key named id');
    }

    var id = data['id'];
    delete data['id'];

    var statement = util.format('UPDATE %s SET %s WHERE %s.id = %s',
        this.tableName,
        _.chain(data)
            .map(function(val, key){
                return util.format('%s = "%s"', key, self.sanitize(val))
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

Model.prototype.deleteBy = function(column, search, callback) {
    var conn = this.db.connection;

    var statement = util.format('DELETE FROM %s WHERE %s = "%s"', this.tableName, column, this.sanitize(search));
    conn.run(statement, function(err){
        if (err) throw err;
        callback(this.changes);
    });
};

module.exports = Model;