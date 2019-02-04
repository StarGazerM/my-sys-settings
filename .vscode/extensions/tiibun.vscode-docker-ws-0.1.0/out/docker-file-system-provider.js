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
const path = require("path");
const vscode = require("vscode");
const docker_exec_1 = require("./docker-exec");
const exceptions_1 = require("./exceptions");
const logging_1 = require("./utils/logging");
class DockerFileSystemProvider {
    constructor() {
        this.eventEmitter = new vscode.EventEmitter();
        /**
         * @inheritdoc
         */
        this.onDidChangeFile = this.eventEmitter.event;
    }
    /**
     * @inheritdoc
     */
    stat(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`stat ${uri.path}`);
            return yield this.statOrThrow(uri);
        });
    }
    /**
     * @inheritdoc
     */
    readDirectory(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`readDirectory ${uri.path}`);
            yield this.statOrThrow(uri);
            return yield docker_exec_1.dockerExec.ls(uri.authority, uri.path);
        });
    }
    /**
    * @inheritdoc
    */
    createDirectory(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`createDirectory ${uri.path}`);
            if (yield this.exists(uri)) {
                throw vscode.FileSystemError.FileExists(`${uri.path} exists.`);
            }
            let parent = uri.with({ path: path.dirname(uri.path) });
            const { fileNotFound, fileStat } = yield this.statOrFileNotFound(parent);
            if (fileStat) {
                if (!fileStat.isWritable()) {
                    throw vscode.FileSystemError.NoPermissions(`${uri.path} is not writable.`);
                }
            }
            else {
                throw fileNotFound;
            }
            yield docker_exec_1.dockerExec.mkdir(uri.authority, uri.path);
            this.eventEmitter.fire([
                { type: vscode.FileChangeType.Changed, uri: parent },
                { type: vscode.FileChangeType.Created, uri }
            ]);
        });
    }
    /**
     * @inheritdoc
     */
    readFile(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`readFile ${uri.path}`);
            yield this.statOrThrow(uri);
            return yield docker_exec_1.dockerExec.cat(uri.authority, uri.path);
        });
    }
    /**
     * @inheritdoc
     */
    writeFile(uri, content, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`writeFile ${uri.path}`);
            const { fileNotFound, fileStat } = yield this.statOrFileNotFound(uri);
            if (fileStat) {
                if (options.overwrite) {
                    if (!fileStat.isWritable()) {
                        throw vscode.FileSystemError.NoPermissions(`${uri.path} is not writable.`);
                    }
                }
                else {
                    throw vscode.FileSystemError.FileExists(`${uri.path} exists.`);
                }
            }
            else {
                if (!options.create) {
                    throw fileNotFound;
                }
            }
            let parent = uri.with({ path: path.dirname(uri.path) });
            const { fileNotFound: parentFileNotFound, fileStat: parentFileStat } = yield this.statOrFileNotFound(parent);
            if (parentFileStat) {
                if (!parentFileStat.isWritable()) {
                    throw vscode.FileSystemError.NoPermissions(`${parent.path} is not writable.`);
                }
            }
            else {
                if (options.create) {
                    throw parentFileNotFound;
                }
            }
            yield docker_exec_1.dockerExec.echo(uri.authority, uri.path, content);
            if (options.create) {
                this.eventEmitter.fire([{ type: vscode.FileChangeType.Created, uri }]);
            }
            this.eventEmitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
        });
    }
    /**
     * @inheritdoc
     */
    delete(uri, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`delete ${uri.path}`);
            yield this.statOrThrow(uri);
            yield docker_exec_1.dockerExec.rm(uri.authority, uri.path, options);
            let parent = uri.with({ path: path.dirname(uri.path) });
            this.eventEmitter.fire([
                { type: vscode.FileChangeType.Changed, uri: parent },
                { type: vscode.FileChangeType.Deleted, uri }
            ]);
        });
    }
    /**
     * @inheritdoc
     */
    rename(oldUri, newUri, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`rename ${oldUri.path} to ${newUri.path}`);
            yield this.statOrThrow(oldUri);
            let newParent = newUri.with({ path: path.dirname(newUri.path) });
            yield this.statOrThrow(newParent);
            const { fileStat: newFileExists } = yield this.statOrFileNotFound(newUri);
            if (newFileExists) {
                if (!options.overwrite) {
                    throw vscode.FileSystemError.FileExists(`${newUri.path} exists.`);
                }
            }
            yield docker_exec_1.dockerExec.mv(oldUri.authority, oldUri.path, newUri.path, options);
            this.eventEmitter.fire([
                { type: vscode.FileChangeType.Deleted, uri: oldUri },
                { type: vscode.FileChangeType.Created, uri: newUri }
            ]);
        });
    }
    /**
     * @inheritdoc
     */
    copy(source, destination, options) {
        return __awaiter(this, void 0, void 0, function* () {
            logging_1.logging.debug(`copy ${source.path} to ${destination.path}`);
            yield this.statOrThrow(source);
            let newParent = destination.with({ path: path.dirname(destination.path) });
            yield this.statOrThrow(newParent);
            const { fileStat: destinationExists } = yield this.statOrFileNotFound(destination);
            if (destinationExists) {
                if (!options.overwrite) {
                    throw vscode.FileSystemError.FileExists(`${destination.path} exists.`);
                }
            }
            yield docker_exec_1.dockerExec.cp(source.authority, source.path, destination.path, options);
            this.eventEmitter.fire([
                { type: vscode.FileChangeType.Deleted, uri: source },
                { type: vscode.FileChangeType.Created, uri: destination }
            ]);
        });
    }
    /**
     * @inheritdoc
     */
    watch(_uri, _options) {
        // ignore changed events
        return new vscode.Disposable(() => { });
    }
    exists(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileStat } = yield this.statOrFileNotFound(uri);
            return (fileStat !== undefined);
        });
    }
    statOrThrow(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileNotFound, fileStat } = yield this.statOrFileNotFound(uri);
            if (fileStat) {
                return fileStat;
            }
            throw fileNotFound;
        });
    }
    statOrFileNotFound(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return { fileStat: yield docker_exec_1.dockerExec.stat(uri.authority, uri.path) };
            }
            catch (err) {
                if (err instanceof exceptions_1.DockerConnectionError) {
                    throw err;
                }
                return { fileNotFound: vscode.FileSystemError.FileNotFound(`${uri.path} does not exist.`) };
            }
        });
    }
}
exports.DockerFileSystemProvider = DockerFileSystemProvider;
//# sourceMappingURL=docker-file-system-provider.js.map