var util = require('util');

function Model(db) {
    this.db = db;
}

Model.prototype.getAll = function() {
    return this.db.connection.get(util.format('SELECT * FROM %s', this.tableName));
};

module.exports = Model;