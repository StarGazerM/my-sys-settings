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
const Docker = require("dockerode");
const exceptions_1 = require("./exceptions");
const stream_buffers_1 = require("stream-buffers");
const logging_1 = require("./utils/logging");
var dockerClient;
(function (dockerClient) {
    /**
     * Initialize dockerode instance.
     *
     * @param options Docker.DockerOptions
     */
    function init(options) {
        dockerClient.docker = new Docker(options);
    }
    dockerClient.init = init;
    /**
     * List docker containers.
     *
     * @throws [`DockerConnectionError`](./exceptions/DockerConnectionError)
     */
    function listInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield dockerClient.docker.listContainers();
            }
            catch (err) {
                throw new exceptions_1.DockerConnectionError(`Docker connection failed - \n${err.json.message}`);
            }
        });
    }
    dockerClient.listInfo = listInfo;
    class Container {
        constructor(containerId) {
            this.containerId = containerId;
            this.container = dockerClient.docker.getContainer(this.containerId);
        }
        /**
         *
         * @param commands command and arguments
         * @throws [`DockerConnectionError`](./exceptions/DockerConnectionError)
         */
        exec(...commands) {
            return __awaiter(this, void 0, void 0, function* () {
                logging_1.logging.debug(() => `execute on ${this.containerId.substr(0, 8)} command: ${commands.map(c => c.length > 30 ? c.substr(0, 27).concat('...') : c).join(' ')}`);
                let exec;
                try {
                    exec = yield this.container.exec({
                        Cmd: commands,
                        AttachStdout: true,
                        AttachStderr: true,
                    });
                }
                catch (err) {
                    throw new exceptions_1.DockerConnectionError(`Docker connection failed - \n${err.json.message}`);
                }
                const stream = yield exec.start({});
                const stdoutBuffer = new stream_buffers_1.WritableStreamBuffer();
                const stderrBuffer = new stream_buffers_1.WritableStreamBuffer();
                dockerClient.docker.modem.demuxStream(stream.output, stdoutBuffer, stderrBuffer);
                return new Promise((resolve, reject) => {
                    stream.output.on('end', () => {
                        if (stderrBuffer.size() > 0) {
                            const stderr = stderrBuffer.getContentsAsString();
                            logging_1.logging.debug(stderr);
                            return reject(stderr);
                        }
                        else if (stdoutBuffer.size() > 0) {
                            return resolve(stdoutBuffer.getContents());
                        }
                        resolve(Buffer.alloc(0));
                    }).on('error', (err) => {
                        reject(err);
                    });
                });
            });
        }
    }
    dockerClient.Container = Container;
})(dockerClient = exports.dockerClient || (exports.dockerClient = {}));
//# sourceMappingURL=docker-client.js.map