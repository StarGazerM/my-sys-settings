"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cache {
    constructor() {
        this.cacheStore = new Map();
    }
    getOrCreate(key, callback) {
        let value = this.cacheStore.get(key);
        if (value === undefined) {
            value = callback();
            this.cacheStore.set(key, value);
        }
        return value;
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map