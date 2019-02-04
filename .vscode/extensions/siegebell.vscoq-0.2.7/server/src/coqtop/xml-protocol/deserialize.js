'use strict';
const deserialize_8_5_1 = require('./deserialize.8.5');
const deserialize_8_6_1 = require('./deserialize.8.6');
const DEFAULT_DESERIALIZER = deserialize_8_6_1.Deserialize_8_6;
function createDeserializer(version) {
    if (version.startsWith('8.5'))
        return new deserialize_8_5_1.Deserialize_8_5();
    else if (version.startsWith('8.6'))
        return new deserialize_8_6_1.Deserialize_8_6();
    else {
        console.warn(`Unknown version of Coq: ${version}; falling back to ${DEFAULT_DESERIALIZER.baseVersion}`);
        return new DEFAULT_DESERIALIZER();
    }
}
exports.createDeserializer = createDeserializer;
//# sourceMappingURL=deserialize.js.map