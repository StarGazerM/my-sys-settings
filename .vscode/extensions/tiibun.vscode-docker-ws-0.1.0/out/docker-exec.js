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
const vscode = require("vscode");
const cache_1 = require("./utils/cache");
const filetype_1 = require("./utils/filetype");
const docker_client_1 = require("./docker-client");
const uuid_1 = require("uuid");
var dockerExec;
(function (dockerExec) {
    const containerCache = new cache_1.Cache();
    function getContainer(id) {
        return containerCache.getOrCreate(id, () => new docker_client_1.dockerClient.Container(id));
    }
    function readlink(containerId, path) {
        return __awaiter(this, void 0, void 0, function* () {
            const buf = yield getContainer(containerId).exec('readlink', '-f', path);
            return buf.toString().trim();
        });
    }
    dockerExec.readlink = readlink;
    const STAT_COMMAND = ['env', 'stat', '-c', '%n|%f|%s|%Z'];
    function stat(container, path, followSymlink = false, encoding = 'utf8') {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof container === 'string') {
                container = getContainer(container);
            }
            let command = STAT_COMMAND;
            if (followSymlink) {
                command = command.concat('-L');
            }
            const statOutput = yield container.exec(...command, path);
            return parseStat(container, statOutput.toString(encoding).split('|'));
        });
    }
    dockerExec.stat = stat;
    function ls(containerId, path, encoding = 'utf8') {
        return __awaiter(this, void 0, void 0, function* () {
            const container = getContainer(containerId);
            const lsOutput = yield container.exec('env', 'ls', '-A', path);
            const fileNames = lsOutput.toString(encoding).split('\n').filter(l => l.length > 0).map(f => `${path === '/' ? '' : path}/${f}`);
            if (fileNames.length === 0) {
                return [];
            }
            const fileList = [];
            const statLines = yield container.exec(...STAT_COMMAND, ...fileNames);
            for (let line of statLines.toString(encoding).split('\n').filter(l => l.length > 0)) {
                const stat = yield parseStat(container, line.split('|'));
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
            return new filetype_1.FileStat(name, parseInt(mode, 16), type, parseInt(size) || 0, parseInt(mtime) || 0, parseInt(mtime) || 0);
        });
    }
    function mkdir(containerId, path) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = getContainer(containerId);
            yield container.exec('env', 'mkdir', path);
        });
    }
    dockerExec.mkdir = mkdir;
    function cat(containerId, path) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = getContainer(containerId);
            return yield container.exec('env', 'cat', path);
        });
    }
    dockerExec.cat = cat;
    function echo(containerId, path, content) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = getContainer(containerId);
            const delimiter = uuid_1.v4();
            yield container.exec('sh', '-c', `head -c -1 <<'${delimiter}' > '${path}'
${content}
${delimiter}`);
        });
    }
    dockerExec.echo = echo;
    function rm(containerId, path, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = getContainer(containerId);
            const commands = ['env', 'rm', '-f'];
            if (options.recursive) {
                commands.push('-r');
            }
            yield container.exec(...commands, path);
        });
    }
    dockerExec.rm = rm;
    function mv(containerId, oldPath, newPath, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = getContainer(containerId);
            const commands = ['env', 'mv'];
            if (options.overwrite) {
                commands.push('-f');
            }
            yield container.exec(...commands, oldPath, newPath);
        });
    }
    dockerExec.mv = mv;
    function cp(containerId, source, destination, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const container = getContainer(containerId);
            const commands = ['env', 'cp'];
            if (options.overwrite) {
                commands.push('-f');
            }
            yield container.exec(...commands, source, destination);
        });
    }
    dockerExec.cp = cp;
})(dockerExec = exports.dockerExec || (exports.dockerExec = {}));
//# sourceMappingURL=docker-exec.js.map