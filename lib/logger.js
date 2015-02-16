var fs = require('fs');


function Logger(filename) {
    this.filename = filename;
}

Logger.prototype.init = function init() {
    try {
        fs.mkdirSync('logs');
    }
    catch (e) {
        if (e['code'] != 'EEXIST') {
            throw e;
        }
    }

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

    //This is an async call without a callback - assumes that all writes will eventually make it, if there is for
    // some reason a backlog of writes (there shouldn't be)
    this.stream.write(data + "\n");
    return this;
};

/**
 * Write to steam with a timestamp prepending the message
 *
 * @param data
 */
Logger.prototype.writeWithStamp = function writeWithStamp(data) {

}

module.exports = Logger;