"use strict";
const nfs = require('fs');
const nzlib = require('zlib');
var fs;
(function (fs) {
    function open(path, flags) {
        return new Promise((resolve, reject) => {
            nfs.open(path, flags, (err, fd) => {
                if (err)
                    reject(err);
                else
                    resolve(fd);
            });
        });
    }
    fs.open = open;
    function writeFile(filename, data, options) {
        return new Promise((resolve, reject) => {
            nfs.writeFile(filename, data, options, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    fs.writeFile = writeFile;
    function readFile(filename, options) {
        return new Promise((resolve, reject) => {
            nfs.readFile(filename, options, (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(data);
            });
        });
    }
    fs.readFile = readFile;
    function exists(path) {
        return new Promise((resolve, reject) => {
            nfs.exists(path, (ex) => resolve(ex));
        });
    }
    fs.exists = exists;
    function stat(path) {
        return new Promise((resolve, reject) => {
            nfs.stat(path, (err, stats) => err ? reject(err) : resolve(stats));
        });
    }
    fs.stat = stat;
    function copyFile(src, dest) {
        return new Promise((resolve, reject) => {
            try {
                let called = false;
                const s = nfs.createReadStream(src);
                const d = nfs.createWriteStream(dest);
                function done(err) {
                    s.destroy();
                    d.end();
                    if (called)
                        return;
                    called = true;
                    reject(err);
                }
                s.on('error', done);
                d.on('error', done);
                d.on('finish', () => resolve());
                s.pipe(d);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    fs.copyFile = copyFile;
})(fs = exports.fs || (exports.fs = {}));
var zlib;
(function (zlib) {
    function gunzip(data, encoding = 'utf8') {
        return new Promise((resolve, reject) => {
            nzlib.gunzip(data, (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(data.toString(encoding));
            });
        });
    }
    zlib.gunzip = gunzip;
})(zlib = exports.zlib || (exports.zlib = {}));
//# sourceMappingURL=nodejs-async.js.map