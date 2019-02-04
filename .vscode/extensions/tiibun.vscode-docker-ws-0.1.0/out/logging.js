'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const extension_variables_1 = require("./extension-variables");
var logging;
(function (logging) {
    function debug(message) {
        write("[DEBUG]", message);
        return message;
    }
    logging.debug = debug;
    function info(message) {
        write("[INFO]", message);
        return message;
    }
    logging.info = info;
    function error(message, err) {
        write("[ERROR]", message);
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
        extension_variables_1.ext.outputChannel.appendLine(allMessage.join(" "));
    }
})(logging = exports.logging || (exports.logging = {}));
//# sourceMappingURL=logging.js.map