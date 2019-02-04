"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
var Level;
(function (Level) {
    Level[Level["DEBUG"] = 0] = "DEBUG";
    Level[Level["INFO"] = 10] = "INFO";
    Level[Level["ERROR"] = 100] = "ERROR";
})(Level = exports.Level || (exports.Level = {}));
var logging;
(function (logging) {
    let outputChannel;
    let _level;
    function init(name, level) {
        outputChannel = vscode.window.createOutputChannel(name);
        _level = level;
    }
    logging.init = init;
    function debug(message) {
        if (_level > Level.DEBUG) {
            return;
        }
        write('[DEBUG]', message);
        return message;
    }
    logging.debug = debug;
    function info(message) {
        if (_level > Level.INFO) {
            return;
        }
        write('[INFO]', message);
        return message;
    }
    logging.info = info;
    function error(message, err) {
        if (_level > Level.ERROR) {
            return;
        }
        write('[ERROR]', message);
        if (err) {
            write(err.message);
            if (err.stack) {
                write(err.stack);
            }
        }
    }
    logging.error = error;
    function write(...messages) {
        const allMessage = [];
        for (let message of messages) {
            if (message instanceof Function) {
                message = message.call();
            }
            allMessage.push(message.toString());
        }
        outputChannel.appendLine(allMessage.join(' '));
    }
})(logging = exports.logging || (exports.logging = {}));
//# sourceMappingURL=logging.js.map