var path = require('path');
var fs = require('fs');

function JsonStore(fileName) {
    this.appDir = path.dirname(require.main.filename);
    this.filePath = path.normalize(path.join(__dirname, 'storage', fileName + ".json"));

    //Create file if it doesn't exist
    if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, '');
    }

    this.fd = fs.openSync(this.filePath, 'r+');

}

JsonStore.prototype.get = function(key) {

};

JsonStore.prototype.set = function(key, value) {

};

module.exports = JsonStore;