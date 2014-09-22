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
    var self = this;
    var data = [];
    var storageDir = path.normalize(path.join(__dirname, 'storage'));

    if (options) {
        if (options.storageDir) {
            storageDir = path.normalize("/" + options.storageDir);
        }
    }

    var filePath = path.normalize(path.join(storageDir, fileName + '.json'));

    var functions = {
        connect: function() {
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
                self.save();
            }

            try {
                data = JSON.parse(fs.readFileSync(filePath));
            }
            catch (e) {
                throw new Error('JsonStore:: Stored .json file is not proper JSON: '+ e.message);
            }
        },
        set: function(key,val) {
            if (!key) {
                this.push(val);
            }
            else {
                if (!isNumeric(key)) {
                    throw Error('Json store key must be numeric!');
                }
                data[key] = val;
            }
        },
        push: function(val) {
            data.push(val);
        },
        get: function(key) {
            return data[key];
        },
        getAll: function() {
            return data;
        },
        remove: function(i) {
            data.splice(i, 1);
            return data;
        },
        save: function() {
            fs.writeFileSync(filePath, JSON.stringify(data));
        }
    };
    for (var key in functions) {
        if (functions.hasOwnProperty(key)) {
            this[key] = functions[key];
        }
    }
    this.connect();
}

module.exports = JsonStore;

