var util = require('util');
var Model = require('../model');

function Profile(db) {
    this.tableName = 'Profile';

    //Call constructor of parent (Model)
    Profile.super_.call(this, db);
}

util.inherits(Profile, Model);

module.exports = Profile;
