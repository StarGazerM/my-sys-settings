'use strict';
const deserialize_base_1 = require('./deserialize.base');
class Deserialize_8_6 extends deserialize_base_1.Deserialize {
    deserialize(v) {
        const value = v;
        try {
            switch (value.$name) {
                case 'message':
                    return {
                        level: value.$children[0],
                        location: value.$children[1],
                        message: value.$children[2],
                    };
                case 'ltacprof':
                    return {
                        total_time: +value.$.total_time,
                        tactics: value.$children,
                    };
                case 'ltacprof_tactic':
                    return {
                        name: value.$.name,
                        statistics: {
                            total: +value.$.total,
                            local: +value.$.local,
                            num_calls: +value.$.ncalls,
                            max_total: +value.$.max_total },
                        tactics: value.$children
                    };
                default:
                    return super.deserialize(v);
            }
        }
        catch (err) {
        }
    }
}
// public deserializeFeedbackContent(v: Node) : any {
//   const value = v as Nodes_8_6.FeedbackContentNode;
//   switch (value.$kind) {
//   default:
//     return super.deserializeFeedbackContent(value);
//   }
// }
Deserialize_8_6.baseVersion = "8.6";
exports.Deserialize_8_6 = Deserialize_8_6;
//# sourceMappingURL=deserialize.8.6.js.map