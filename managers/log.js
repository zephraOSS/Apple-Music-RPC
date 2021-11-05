const log = require("electron-log");

function info (sel, msg) {
    console.log(`%c${sel}%c${msg}`, "background-color: #0094FF; color: white; border-radius: 6px; padding: 0 5px;", "padding-left: 5px; color: white;");
    log.log(sel, msg);
}

function success (sel, msg) {
    console.log(`%c${sel}%c${msg}`, "background-color: #54C461; color: white; border-radius: 6px; padding: 0 5px;", "padding-left: 5px; color: white;");
    log.log(sel, msg);
}

function error (sel, msg) {
    console.log(`%c${sel}%c${msg}`, "background-color: #E04747; color: white; border-radius: 6px; padding: 0 5px;", "padding-left: 5px; color: white;");
    log.log(sel, msg);
}

exports.logInfo = info;
exports.logSuccess = success;
exports.logError = error;