'use strict';
var path = require('path');
var fs = require('fs');

function JsonStore(fileName) {
    var data = {};
    var storageDir = path.normalize(path.join(__dirname, 'storage'));
    var filePath = path.normalize(path.join(storageDir, fileName + '.json'));

    var functions = {
        connect: function() {
            //Create file if it doesn't exist
            if (!fs.exists(filePath)) {
                fs.mkdir(storageDir, function(e){
                    if (e && e.code != 'EEXIST') { throw e; }
                });
                this.save();
            }

            try {
                this.data = JSON.parse(fs.readFileSync(filePath));
            }
            catch (e) {
                throw new Error('JsonStore:: Stored .json file is not proper JSON: '+ e.message);
            }
        },
        set: function(key,val) { data[key]=val; },
        get: function(key) { return data[key]; },
        save: function() { fs.writeFileSync(filePath, JSON.stringify(data)); }
    };
    for (var key in functions) {
        if (functions.hasOwnProperty(key)) {
            this[key] = functions[key];
        }
    }
    this.connect();
}

module.exports = JsonStore;

