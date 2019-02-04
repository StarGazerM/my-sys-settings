"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function isFileNotFound(error) {
    return isFileSystemErrorOf(error, 'EntryNotFound');
}
exports.isFileNotFound = isFileNotFound;
function isFileExists(error) {
    return isFileSystemErrorOf(error, 'EntryExists');
}
exports.isFileExists = isFileExists;
function isFileNotADirectory(error) {
    return isFileSystemErrorOf(error, 'EntryNotADirectory');
}
exports.isFileNotADirectory = isFileNotADirectory;
function isFileIsADirectory(error) {
    return isFileSystemErrorOf(error, 'EntryIsADirectory');
}
exports.isFileIsADirectory = isFileIsADirectory;
function isNoPermissions(error) {
    return isFileSystemErrorOf(error, 'NoPermissions');
}
exports.isNoPermissions = isNoPermissions;
function isUnavailable(error) {
    return isFileSystemErrorOf(error, 'Unavailable');
}
exports.isUnavailable = isUnavailable;
function isFileSystemErrorOf(error, code) {
    return error instanceof vscode.FileSystemError &&
        error.name === `${code} (FileSystemError)`;
}
//# sourceMappingURL=error-handler.js.map