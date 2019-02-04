"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("./container");
const cache_1 = require("./utils/cache");
var containers;
(function (containers) {
    const containerCache = new cache_1.Cache();
    function get(id) {
        return containerCache.getOrCreate(id, () => new container_1.Container(id));
    }
    containers.get = get;
})(containers = exports.containers || (exports.containers = {}));
//# sourceMappingURL=containers.js.map