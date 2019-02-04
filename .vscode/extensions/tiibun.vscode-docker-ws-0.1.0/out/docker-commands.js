"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const docker_client_1 = require("./docker-client");
const logging_1 = require("./utils/logging");
const vscode = require("vscode");
const filetype_1 = require("./utils/filetype");
const cache_1 = require("./utils/cache");
var dockerExec;
(function (dockerExec) {
    function readlink(containerId, path) {
        return __awaiter(this, void 0, void 0, function* () {
            const buf = yield docker_client_1.dockerClient.exec(getContainer(containerId), "readlink", "-f", path);
            return buf.toString().trim();
        });
    }
    dockerExec.readlink = readlink;
    const STAT_COMMAND = ["env", "stat", "-c", "%n|%f|%s|%Z"];
    function stat(container, path, followSymlink = false, encoding = "utf8") {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`stat ${path}`);
            if (typeof container === "string") {
                container = getContainer(container);
            }
            let command = STAT_COMMAND;
            if (followSymlink) {
                command = command.concat("-L");
            }
            try {
                const statOutput = yield docker_client_1.dockerClient.exec(container, ...command, path);
                return parseStat(container, statOutput.toString(encoding).split("|"));
            }
            catch (err) {
                // vscode and extensions read stat of several files, so ignore that.
                return { type: vscode.FileType.Unknown, size: 0, ctime: 0, mtime: 0 };
            }
        });
    }
    dockerExec.stat = stat;
    function ls(containerId, path, followSymlink = false, encoding = "utf8") {
        return __awaiter(this, void 0, void 0, function* () {
            const container = getContainer(containerId);
            const lsOutput = yield docker_client_1.dockerClient.exec(container, "ls", "-A", path);
            const fileNames = lsOutput.toString(encoding).split("\n").filter(l => l.length > 0).map(f => `${path === "/" ? "" : path}/${f}`);
            if (fileNames.length === 0) {
                return [];
            }
            const fileList = [];
            const statLines = yield docker_client_1.dockerClient.exec(container, ...STAT_COMMAND, ...fileNames);
            for (let line of statLines.toString(encoding).split("\n").filter(l => l.length > 0)) {
                const stat = yield parseStat(container, line.split("|"));
                fileList.push([stat.name, stat.type]);
            }
            return fileList;
        });
    }
    dockerExec.ls = ls;
    function parseStat(container, [name, mode, size, mtime]) {
        return __awaiter(this, void 0, void 0, function* () {
            let type = filetype_1.detectFileType(parseInt(mode, 16));
            if (type === vscode.FileType.SymbolicLink) {
                const followedSymlinkStat = yield stat(container, name, true);
                type = vscode.FileType.SymbolicLink | followedSymlinkStat.type;
            }
            return {
                name: name,
                type: type,
                size: parseInt(size) || 0,
                ctime: parseInt(mtime) || 0,
                mtime: parseInt(mtime) || 0,
            };
        });
    }
    function mkdir(containerId, path) {
        return __awaiter(this, void 0, void 0, function* () {
            yield docker_client_1.dockerClient.exec(getContainer(containerId), "mkdir", path);
        });
    }
    dockerExec.mkdir = mkdir;
    const containerCache = new cache_1.Cache();
    function getContainer(containerId) {
        return containerCache.getOrCreate(containerId, () => docker_client_1.dockerClient.getContainer(containerId));
    }
})(dockerExec = exports.dockerExec || (exports.dockerExec = {}));
//# sourceMappingURL=docker-commands.js.map