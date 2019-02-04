"use strict";
const xml2js = require('xml2js');
function richppToMarkdown(text) {
    return new Promise((resolve, reject) => {
        const xml = xml2js.parseString(text, {
            charkey: '_char',
            trim: false,
            explicitArray: false,
        }, (err, result) => {
            if (err || !result || result.hasOwnProperty('richpp'))
                resolve(text);
            else
                resolve(result['richpp']._);
        });
    });
}
exports.richppToMarkdown = richppToMarkdown;
//# sourceMappingURL=RichPP.js.map