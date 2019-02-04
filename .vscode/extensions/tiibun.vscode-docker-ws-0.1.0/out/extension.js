"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const commands_1 = require("./commands");
const docker_client_1 = require("./docker-client");
const docker_file_system_provider_1 = require("./docker-file-system-provider");
const logging_1 = require("./utils/logging");
function activate(context) {
    logging_1.logging.init('Docker Workspace', logging_1.Level.INFO);
    docker_client_1.dockerClient.init(getConfiguration());
    let dockerws = new docker_file_system_provider_1.DockerFileSystemProvider();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider('docker', dockerws, { isCaseSensitive: true }), vscode.commands.registerCommand('dockerws:addDockerFolder', commands_1.addDockerFolder));
}
exports.activate = activate;
function getConfiguration() {
    // Use 1) dockerWS.host 2) docker.host
    const value = vscode.workspace.getConfiguration('dockerWS').get('host') ||
        vscode.workspace.getConfiguration('docker').get('host', '');
    const errorMessage = 'The docker.host configuration setting must be entered as <host>:<port>, e.g. dockerhost:2375';
    if (value) {
        let newHost = '';
        let newPort = 2375;
        let sep = -1;
        sep = value.lastIndexOf(':');
        if (sep < 0) {
            vscode.window.showErrorMessage(errorMessage);
        }
        else {
            newHost = value.slice(0, sep);
            newPort = Number(value.slice(sep + 1));
            if (isNaN(newPort)) {
                vscode.window.showErrorMessage(errorMessage);
            }
            else {
                return { host: newHost, port: newPort };
            }
        }
    }
    return;
}
//# sourceMappingURL=extension.js.map