'use strict';
var path = require('path');
var fs = require('fs');

function JsonStore(fileName) {
    var self = this;
    var data = [];
    var storageDir = path.normalize(path.join(__dirname, 'storage'));
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
                data.push(val);
            }
            else {
                data[key] = val;
            }
        },
        get: function(key) {
            return data[key];
        },
        getAll: function() {
            return data;
        },
        getAllAsArray: function() {
            var arr = [];
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    //Give object a prop named 'key' which is assigned the original key, if not set
                    if (!data[key].key) {
                        data[key].key = key;
                    }
                    arr.push(data);
                }
            }
            return arr;
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

