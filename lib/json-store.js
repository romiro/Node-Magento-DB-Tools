'use strict';
var path = require('path');
var fs = require('fs');
var isNumeric = require('./tools').isNumeric;

/**
 *
 * @param fileName
 * @param options
 *      storageDir: Absolute path to json file
 * @constructor
 */
function JsonStore(fileName, options) {
    var data = [];
    var storageDir = path.normalize(path.join(__dirname, 'storage'));

    if (options) {
        if (options.storageDir) {
            storageDir = path.normalize("/" + options.storageDir);
        }
    }

    var filePath = path.normalize(path.join(storageDir, fileName + '.json'));

    this.connect = function() {
        //Create file if it doesn't exist
        if (!fs.existsSync(filePath)) {
            try {
                fs.mkdirSync(storageDir);
            }
            catch (e) {
                if (e.code != 'EEXIST') {
                    throw e;
                }
            }
            this.save();
        }

        try {
            data = JSON.parse(fs.readFileSync(filePath));
        }
        catch (e) {
            throw new Error('JsonStore:: Stored .json file is not proper JSON: '+ e.message);
        }
    };

    this.set = function(key,val) {
        if (!key) {
            this.push(val);
        }
        else {
            if (!isNumeric(key)) {
                throw Error('Json store key must be numeric!');
            }
            data[key] = val;
        }
    };

    this.push = function(val) {
        data.push(val);
    };

    this.get = function(key) {
        return data[key];
    };

    this.getAll = function() {
        return data;
    };

    this.getBy = function(property, search) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].hasOwnProperty(property) && data[i][property] == search) {
                return data[i];
            }
        }
        return false;
    };

    this.remove = function(i) {
        data.splice(i, 1);
        return data;
    };

    this.save = function() {
        fs.writeFileSync(filePath, JSON.stringify(data));
    };

    this.connect();
}

module.exports = JsonStore;
