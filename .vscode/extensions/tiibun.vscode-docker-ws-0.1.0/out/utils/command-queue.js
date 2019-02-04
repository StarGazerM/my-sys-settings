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
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class CommandQueue {
    constructor() {
        this.queue = [];
    }
    push(item) {
        this.queue.push(item);
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            while (this.queue[0] !== item) {
                yield wait(100);
            }
            try {
                const item = this.queue.shift();
                if (!item) {
                    return reject("queue is empty.");
                }
                resolve(yield item.exec());
            }
            catch (err) {
                reject(err);
            }
        }));
    }
}
exports.CommandQueue = CommandQueue;
//# sourceMappingURL=command-queue.js.map