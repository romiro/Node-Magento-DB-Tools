function Tools() {}

Tools.getUserHome = function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
};

Tools.isNumeric = function(obj) {
    obj = typeof(obj) === "string" ? obj.replace(",", ".") : obj;
    return !isNaN(parseFloat(obj)) && isFinite(obj) && Object.prototype.toString.call(obj).toLowerCase() !== "[object array]";
};

module.exports = Tools;