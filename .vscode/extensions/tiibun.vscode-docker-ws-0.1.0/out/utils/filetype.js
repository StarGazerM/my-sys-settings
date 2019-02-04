"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
exports.hasType = (target, fileType) => (target & fileType) === fileType;
const hasMode = (target, mode) => (target & mode) === mode;
function detectFileType(mode) {
    if (hasMode(mode, fs.constants.S_IFLNK)) {
        return vscode.FileType.SymbolicLink;
    }
    else if (hasMode(mode, fs.constants.S_IFREG)) {
        return vscode.FileType.File;
    }
    else if (hasMode(mode, fs.constants.S_IFDIR)) {
        return vscode.FileType.Directory;
    }
    else {
        return vscode.FileType.Unknown;
    }
}
exports.detectFileType = detectFileType;
class FileStat {
    constructor(name, mode, type, size, ctime, mtime) {
        this.name = name;
        this.mode = mode;
        this.type = type;
        this.size = size;
        this.ctime = ctime;
        this.mtime = mtime;
        this.isDirectory = () => exports.hasType(this.type, vscode.FileType.Directory);
        this.isWritable = () => hasMode(this.mode, fs.constants.S_IWUSR);
    }
}
exports.FileStat = FileStat;
//# sourceMappingURL=filetype.js.map