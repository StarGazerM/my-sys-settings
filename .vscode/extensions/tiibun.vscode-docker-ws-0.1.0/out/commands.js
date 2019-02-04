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
const path_1 = require("path");
const vscode = require("vscode");
const docker_client_1 = require("./docker-client");
const docker_exec_1 = require("./docker-exec");
const logging_1 = require("./utils/logging");
function addDockerFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        let containers;
        try {
            containers = yield docker_client_1.dockerClient.listInfo();
        }
        catch (err) {
            logging_1.logging.error(err.message);
            vscode.window.showErrorMessage('Unable to connect to Docker.');
            return;
        }
        if (containers.length === 0) {
            vscode.window.showInformationMessage('There are no running Docker containers.');
            return;
        }
        const container = yield pickContainer(containers);
        if (!container) {
            return;
        }
        const folderName = yield inputPath();
        if (!folderName) {
            return;
        }
        let absPath;
        try {
            absPath = yield getAbsolutePath(container.Id, folderName);
            if (!(yield isDirectory(container.Id, absPath))) {
                vscode.window.showErrorMessage(`${folderName} is not a directory.`);
                return;
            }
        }
        catch (err) {
            vscode.window.showErrorMessage(`${folderName} does not exist.`);
            return;
        }
        const start = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length || 0;
        const uri = vscode.Uri.parse(`docker://${container.Id}${absPath}`);
        vscode.workspace.updateWorkspaceFolders(start, 0, {
            uri,
            name: `${path_1.basename(folderName)} | ${container.Image} (${container.Names[0].substr(1)})`
        });
    });
}
exports.addDockerFolder = addDockerFolder;
function getAbsolutePath(containerId, folderName) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield docker_exec_1.dockerExec.readlink(containerId, folderName);
    });
}
function isDirectory(containerId, folderName) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileStat = yield docker_exec_1.dockerExec.stat(containerId, folderName);
        return fileStat.isDirectory();
    });
}
function pickContainer(containers) {
    return __awaiter(this, void 0, void 0, function* () {
        const containerName = yield vscode.window.showQuickPick(containers.map(container => `${container.Image}(${container.Names[0]}:${container.Id.substr(0, 8)})`));
        if (!containerName) {
            return;
        }
        const [, id] = containerName.match(/:([0-9a-f]{8})\)$/);
        return containers.find(container => container.Id.startsWith(id));
    });
}
function inputPath() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield vscode.window.showInputBox({ prompt: 'Directory Path', value: '.' });
    });
}
//# sourceMappingURL=commands.js.map