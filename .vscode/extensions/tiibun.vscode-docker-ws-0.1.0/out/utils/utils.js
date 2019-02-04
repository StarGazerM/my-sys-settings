'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const constants_1 = require("constants");
function isSymbolicLink(mode) {
    return (mode & constants_1.S_IFLNK) === constants_1.S_IFLNK;
}
function isRegularFile(mode) {
    return (mode & constants_1.S_IFREG) === constants_1.S_IFREG;
}
function isDirectory(mode) {
    return (mode & constants_1.S_IFDIR) === constants_1.S_IFDIR;
}
function detectFileType(mode) {
    if (isSymbolicLink(mode)) {
        return vscode_1.FileType.SymbolicLink;
    }
    else if (isRegularFile(mode)) {
        return vscode_1.FileType.File;
    }
    else if (isDirectory(mode)) {
        return vscode_1.FileType.Directory;
    }
    else {
        return vscode_1.FileType.Unknown;
    }
}
exports.detectFileType = detectFileType;
//# sourceMappingURL=utils.js.map