var fs = require('fs');


function Logger(filename) {
    this.filename = filename;
}

Logger.prototype.init = function init() {
    try {
        var filename = 'logs/' + this.filename;
        this.stream = fs.createWriteStream(filename, {flags: 'a'});
    }
    catch (e) {
        console.log('LOGGER: Could not open file %s for writing! %s', filename, e);
        return false;
    }
    return this;
};

Logger.prototype.write = function write(data) {
    if (!this.stream) {
        console.log('LOGGER: Attempted write when stream does not exist.');
        return false;
    }
    this.stream.write(data + "\n");
    return this;
};

module.exports = Logger;