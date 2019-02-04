"use strict";
'use script';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const docker_client_1 = require("./docker-client");
const logging_1 = require("./utils/logging");
const filetype_1 = require("./utils/filetype");
const STAT_COMMAND = ["env", "stat", "-c", "%n|%f|%s|%Z"];
class ContainerFS {
    constructor(id) {
        this.id = id;
        this.container = docker_client_1.dockerClient.getContainer(this.id);
    }
    stat(path, followSymlink = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!path) {
                throw new Error("path is required.");
            }
            logging_1.logging.debug(`stat ${path}`);
            const command = followSymlink ? [...STAT_COMMAND, "-L"] : STAT_COMMAND;
            try {
                const statOutput = yield docker_client_1.dockerClient.exec(this.container, ...command, path);
                return this.buildFileStat(statOutput.toString('utf8'));
            }
            catch (err) {
                // vscode and extensions read stat of several files, so ignore that.
                return { type: vscode.FileType.Unknown, size: 0, ctime: 0, mtime: 0 };
            }
        });
    }
    buildFileStat(statOutput) {
        return __awaiter(this, void 0, void 0, function* () {
            const [name, mode, size, mtime] = statOutput.split("|");
            let type = filetype_1.detectFileType(parseInt(mode, 16));
            if (type === vscode.FileType.SymbolicLink) {
                const followedSymlinkStat = yield this.stat(name, true);
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
    readDirectory(path, followSymlink = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const lsOutput = yield docker_client_1.dockerClient.exec(this.container, "ls", "-A", path);
            const fileNames = lsOutput.toString().split("\n").filter(l => l.length > 0).map(f => `${path}/${f}`);
            if (fileNames.length === 0) {
                return [];
            }
            const fileList = [];
            const statLines = yield docker_client_1.dockerClient.exec(this.container, ...STAT_COMMAND, ...fileNames);
            for (let line of statLines.toString('utf8').split("\n").filter(l => l.length > 0)) {
                const stat = yield this.buildFileStat(line);
                fileList.push([stat.name, stat.type]);
            }
            return fileList;
        });
    }
    createDirectory(path) {
        return __awaiter(this, void 0, void 0, function* () {
            docker_client_1.dockerClient.exec(this.container, "mkdir", path);
        });
    }
    readFile(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return docker_client_1.dockerClient.exec(this.container, "cat", path);
        });
    }
    writeFile(path, content, options) {
        return __awaiter(this, void 0, void 0, function* () {
            docker_client_1.dockerClient.exec(this.container, "sh", "-c", `echo -n \"${content}\" > ${path}`);
        });
    }
    delete(path, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const commands = ["rm", "-f"];
            if (options.recursive) {
                commands.push("-r");
            }
            docker_client_1.dockerClient.exec(this.container, ...commands, path);
        });
    }
    rename(oldPath, newPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const commands = ["mv"];
            if (options.overwrite) {
                commands.push("-f");
            }
            docker_client_1.dockerClient.exec(this.container, ...commands, oldPath, newPath);
        });
    }
}
exports.ContainerFS = ContainerFS;
//# sourceMappingURL=container-fs.js.map