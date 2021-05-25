"use strict";
var fs = require('fs');
/**
 * Checks to ensure that the filepath exists. Resolves or rejects a Promise
 *
 * @param  String
 * @return Promise<string>
 */
function exists(filepath) {
    return new Promise(function (resolve, reject) {
        fs.access(filepath, function (err) {
            if (!err)
                resolve(filepath);
            else
                reject(new Error('File does not exist'));
        });
    });
}
exports.exists = exists;
//# sourceMappingURL=index.js.map