"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DockerConnectionError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, DockerConnectionError.prototype);
    }
}
exports.DockerConnectionError = DockerConnectionError;
//# sourceMappingURL=exceptions.js.map