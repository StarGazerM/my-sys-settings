"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const glob = require('glob');
const nasync = require('./nodejs-async');
const hostedFiles = new Map();
let server = null;
let serverReady = null;
function handleRequest(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestPath = url.parse(request.url).pathname;
        const file = hostedFiles.get(requestPath);
        try {
            if (!file || !(yield nasync.fs.exists(file.fsPath))) {
                respondFileNotFound(response);
                return;
            }
        }
        catch (err) {
            respondError(response, err);
        }
        try {
            if (file.contentType)
                response.writeHead(200, { "Content-Type": file.contentType });
            else
                response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            fs.createReadStream(file.fsPath).pipe(response);
        }
        catch (err) {
            response.end();
        }
    });
}
function respondError(response, err) {
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.write("Error:\n");
    response.write(err.toString() + "\n");
    response.end();
}
function respondFileNotFound(response) {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.write("404 Not Found\n");
    response.end();
}
function serveDirectory(rootPath, basePath, globPattern) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!rootPath.startsWith('/'))
            rootPath = '/' + rootPath;
        const matches = yield new Promise((resolve, reject) => glob(globPattern, { cwd: basePath, root: basePath, silent: true, nonull: false }, function (err, matches) {
            if (err)
                reject(err);
            resolve(matches);
        }));
        if (!matches)
            return null;
        matches.forEach(file => {
            hostedFiles.set(path.join(rootPath, file).replace(/\\/g, '/'), { fsPath: path.join(basePath, file) });
        });
        const address = yield initServer();
        if (!address)
            return null;
        return vscode.Uri.parse(`http://${address.host}:${address.port}${rootPath}`);
    });
}
exports.serveDirectory = serveDirectory;
function serveFile(path, file, contentType) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!path.startsWith('/'))
            path = '/' + path;
        hostedFiles.set(path, { fsPath: file, contentType: contentType });
        const address = yield initServer();
        if (!address)
            return null;
        return vscode.Uri.parse(`http://${address.host}:${address.port}/${path}`);
    });
}
exports.serveFile = serveFile;
function initServer() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!server) {
            server = http.createServer(handleRequest);
            serverReady = new Promise((resolve, reject) => {
                try {
                    server.listen({ port: 0, host: "localhost" }, () => {
                        const addr = server.address();
                        resolve({ host: "localhost", port: addr.port });
                    });
                    server.on('close', () => {
                        server = null;
                        serverReady = null;
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
            // kill the server when this application closes (don't keep alive)
            server.unref();
        }
        return serverReady;
    });
}
//# sourceMappingURL=WebServer.js.map