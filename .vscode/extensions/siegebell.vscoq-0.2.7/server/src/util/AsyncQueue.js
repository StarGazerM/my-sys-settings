'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
class Semaphore {
    constructor() {
        // points to the decr job-promise for executeOneTask to wait for
        // when executeOneTask is resumed, it calls the result of the promise to advance the decr pointer
        this.decrPromise = this.createNext();
    }
    createNext() {
        return new Promise((resolve) => {
            this.incrPromise = () => {
                const futureNext = this.createNext();
                resolve(() => { this.decrPromise = futureNext; });
            };
        });
    }
    incr() {
        this.incrPromise();
    }
    decr() {
        return __awaiter(this, void 0, void 0, function* () {
            (yield this.decrPromise)();
        });
    }
}
exports.Semaphore = Semaphore;
class AsyncQueue {
    constructor() {
        this.queue = [];
        this.count = new Semaphore();
    }
    enqueue(item) {
        this.queue.push(item);
        this.count.incr();
    }
    length() {
        return this.queue.length;
    }
    dequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.count.decr();
            return this.queue.shift();
        });
    }
}
exports.AsyncQueue = AsyncQueue;
class AsyncWorkQueue {
    constructor() {
        this.work = new AsyncQueue();
    }
    process(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.work.enqueue({ task: task, resolve: resolve, reject: reject });
            });
        });
    }
    hasWork() {
        return this.work.length() > 0;
    }
    executeOneTask() {
        return __awaiter(this, void 0, void 0, function* () {
            const job = yield this.work.dequeue();
            try {
                job.resolve(yield job.task());
            }
            catch (error) {
                job.reject(error);
            }
        });
    }
}
exports.AsyncWorkQueue = AsyncWorkQueue;
//# sourceMappingURL=AsyncQueue.js.map