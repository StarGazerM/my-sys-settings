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
class Command {
    constructor(container) {
        this.container = container;
    }
}
class RenameCommand extends Command {
    constructor(container, oldPath, newPath, options) {
        super(container);
        this.oldPath = oldPath;
        this.newPath = newPath;
        this.options = options;
        if (!oldPath || !newPath) {
            throw new Error("path is required.");
        }
    }
    exec() {
        return __awaiter(this, void 0, void 0, function* () {
            const commands = ["mv"];
            if (this.options.overwrite) {
                commands.push("-f");
            }
            docker_client_1.dockerClient.exec(this.container, ...commands, this.oldPath, this.newPath);
        });
    }
}
exports.RenameCommand = RenameCommand;
//# sourceMappingURL=file-system-commands.js.map