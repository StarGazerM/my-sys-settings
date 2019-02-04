'use strict';
// const logger = console;
const logger = {
    log: (x) => { }
};
class Mutex {
    constructor() {
        this.locked = false;
        // wait chain; only one caller may await this promise; when they do, they will append
        // a fresh promise for the next caller to await
        this.locking = Promise.resolve(() => Promise.resolve());
        // private canceller: (reason:string) => void = (reason) => {};
        // private cancellingInProgress = false;
        this.unlockingNext = Promise.resolve();
        this.waitingCount = 0;
        // public static reasonAllCancelled = 'all-cancelled';
        // private static announceAllCancelled = 'announce-all-cancelled';
        this.nextId = 0;
    }
    isLocked() {
        return this.locked;
    }
    wrapCancellationToken(cancellationToken) {
        return new Promise((resolve, reject) => {
            if (typeof cancellationToken === "number")
                setTimeout(() => reject(Mutex.reasonTimout), cancellationToken);
            else {
                cancellationToken.then(() => { });
                cancellationToken.then(() => reject(Mutex.reasonCancelled));
            }
        });
    }
    toString() {
        return `{locked: ${this.locked}, waiting: ${this.waitingCount}}`;
    }
    /**
     * @returns a function that unlocks this mutex
     */
    lock(cancellationToken) {
        logger.log('Mutex.lock(...)');
        this.locked = true;
        const self = this;
        const myId = this.nextId++;
        ++this.waitingCount;
        let isCancelled = false;
        let unlockNext;
        let cancelNext;
        // The next caller in line will lock against this promise.
        // When they do so, they effectively tell us who to call
        // when we are unlocked by registering themselves as unlockNext
        const willLock = new Promise((resolve, reject) => {
            unlockNext = () => {
                // in case the mutex was cancelled before we unlock, resolve() will do nothing, so we cannot rely on it to unlock this mutex
                if (self.waitingCount === 0)
                    self.locked = false;
                logger.log(`unlocking ${self.toString()}`);
                return resolve();
            };
            cancelNext = reject;
        });
        willLock
            .then(() => {
            if (self.waitingCount === 0)
                self.locked = false;
            logger.log(`unlocked (willLock) ${self.toString()}`);
        }, (reason) => {
            logger.log(`rejected!!! ${myId} (willLock) ${self.toString()}`);
        });
        // cache current locking for the upcoming 'then'/'catch' 
        const currentLocking = this.locking;
        // A promise to unlock the next thread in line
        let willUnlock;
        if (cancellationToken !== undefined)
            willUnlock = Promise.race([currentLocking.then(() => {
                    self.locked = true;
                    if (!isCancelled)
                        --this.waitingCount;
                    // this.canceller = cancelNext;
                    logger.log(`acquired lock ${myId} ${self.toString()}`);
                    return unlockNext;
                }),
                this.wrapCancellationToken(cancellationToken)
            ])
                .catch((reason) => {
                --this.waitingCount;
                isCancelled = true;
                logger.log(`locking cancelled for: ${reason}; ${self.toString()}`);
                // // When we eventually receive the lock, immediately unlock the next waiter
                // if(reason === Mutex.reasonAllCancelled)
                //   cancelNext(reason);
                // But forward the rejection to our awaiter 
                return Promise.reject(reason);
            });
        else
            willUnlock = currentLocking.then(() => {
                self.locked = true;
                if (!isCancelled)
                    --this.waitingCount;
                // self.canceller = cancelNext;
                logger.log(`acquired lock ${myId} ${self.toString()}`);
                return unlockNext;
            }, (reason) => {
                --this.waitingCount;
                isCancelled = true;
                logger.log(`locking cancelled for: ${reason}; ${self.toString()}`);
                // // When we eventually receive the lock, immediately unlock the next waiter
                // if(reason === Mutex.reasonAllCancelled)
                //   cancelNext(reason);
                // But forward the rejection to our awaiter 
                return Promise.reject(reason);
            });
        // The next caller in line will have to register themselves
        // against the updated locking mechanism: willLock
        this.locking = currentLocking
            .then(() => {
            logger.log(`locking acquired ${myId} ${self.toString()}`);
            if (isCancelled)
                unlockNext();
            return willLock;
        }, (reason) => {
            logger.log(`locking cancelled (next)`);
            return Promise.reject(reason);
        });
        return willUnlock;
    }
}
Mutex.reasonCancelled = 'cancelled';
Mutex.reasonTimout = 'timeout';
exports.Mutex = Mutex;
//# sourceMappingURL=Mutex.js.map