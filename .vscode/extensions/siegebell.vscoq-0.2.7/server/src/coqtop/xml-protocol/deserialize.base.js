'use strict';
const coqProto = require('../coq-proto');
const util = require('util');
const coq_proto_1 = require('../coq-proto');
// export interface TypedNode {
//   $name: string;
//   $text: string;
//   /* attributes */
//   $: { [key:string]:coqProto.CoqValue };
//   /* children */
//   $children : coqProto.CoqValue[];
// }
var Nodes;
(function (Nodes) {
    function optionIsSome(opt) {
        return opt.$.val === 'some';
    }
    Nodes.optionIsSome = optionIsSome;
    function optValIsInt(opt) {
        return opt.$.val === 'intvalue';
    }
    Nodes.optValIsInt = optValIsInt;
    function optValIsStringOpt(opt) {
        return opt.$.val === 'stringoptvalue';
    }
    Nodes.optValIsStringOpt = optValIsStringOpt;
    function optValIsBool(opt) {
        return opt.$.val === 'boolvalue';
    }
    Nodes.optValIsBool = optValIsBool;
    function optValIsString(opt) {
        return opt.$.val === 'stringvalue';
    }
    Nodes.optValIsString = optValIsString;
    function isInl(value) {
        return value.tag === 'inl';
    }
    Nodes.isInl = isInl;
    function isFailValue(value) {
        return value.$.val === 'fail';
    }
    Nodes.isFailValue = isFailValue;
    function isGoodValue(value) {
        return value.$.val === 'good';
    }
    Nodes.isGoodValue = isGoodValue;
})(Nodes = exports.Nodes || (exports.Nodes = {}));
function check(tag, result) {
    return result;
}
function unreachable(x) { return x; }
class Deserialize {
    constructor() {
    }
    deserialize(value) {
        return this.doDeserialize(value);
    }
    doDeserialize(value) {
        switch (value.$name) {
            case 'state_id':
                return check(value.$name, +value.$.val);
            case 'edit_id':
                return check(value.$name, +value.$.val);
            case 'int':
                return check(value.$name, +value.$children[0]);
            case 'string':
                return check(value.$name, value.$children[0]);
            case 'unit':
                return check(value.$name, {});
            case 'pair':
                return check(value.$name, value.$children);
            case 'list':
                return check(value.$name, value.$children);
            case 'bool':
                if (typeof value.$.val === 'boolean')
                    return check(value.$name, value.$.val);
                else if (value.$.val.toLocaleLowerCase() === 'true')
                    return check(value.$name, true);
                else
                    return check(value.$name, false);
            case 'union':
                switch (value.$.val) {
                    case 'in_l': return check(value.$name, { tag: 'inl', value: value.$children[0] });
                    case 'in_r': return check(value.$name, { tag: 'inr', value: value.$children[0] });
                }
                break;
            case 'option':
                return check(value.$name, Nodes.optionIsSome(value) ? value.$children[0] : null);
            case 'option_value': {
                if (Nodes.optValIsInt(value))
                    return check(value.$name, value.option);
                else if (Nodes.optValIsStringOpt(value))
                    return check(value.$name, value.option);
                else if (Nodes.optValIsBool(value))
                    return check(value.$name, value.bool);
                else if (Nodes.optValIsString(value))
                    return check(value.$name, value.$children[0]);
                else
                    break;
            }
            case 'option_state': {
                return check(value.$name, {
                    synchronized: value.$children[0],
                    deprecated: value.$children[1],
                    name: value.$children[2],
                    value: value.$children[3],
                });
            }
            case 'goal':
                return check(value.$name, {
                    id: +value.$children[0],
                    hypotheses: value.$children[1],
                    goal: value.$children[2] || []
                });
            case 'goals': {
                return check(value.$name, {
                    goals: value.$children[0] || [],
                    backgroundGoals: (value.$children[1] || [])
                        .reduce((bg, v) => ({ before: v[0], next: bg, after: v[1] }), null),
                    shelvedGoals: value.$children[2] || [],
                    abandonedGoals: value.$children[3] || []
                });
            }
            case 'loc':
                return check(value.$name, { start: +value.$.start, stop: +value.$.stop });
            case 'message_level':
                return check(value.$name, coqProto.MessageLevel[value.$.val]);
            case 'message':
                return check(value.$name, {
                    level: value.message_level,
                    message: value.$children[1] || ""
                });
            case 'status':
                return check(value.$name, {
                    path: value.$children[0],
                    proofName: value.$children[1],
                    allProofs: value.$children[2],
                    proofNumber: value.$children[3],
                });
            case 'value':
                if (Nodes.isGoodValue(value))
                    return check(value.$name, { status: 'good', result: value.$children[0] });
                else
                    return check(value.$name, {
                        status: 'fail',
                        stateId: value.$children[0],
                        message: value.$children[1] || "",
                        location: { start: +value.$.loc_s, stop: +value.$.loc_e },
                    });
            case 'ltacprof_tactic':
                return check(value.$name, {
                    name: value.$.name,
                    statistics: {
                        total: +value.$.total,
                        local: +value.$.self,
                        num_calls: +value.$.num_calls,
                        max_total: +value.$.max_total },
                    tactics: value.$children
                });
            case 'ltacprof':
                return check(value.$name, {
                    total_time: +value.$.total_time,
                    tactics: value.$children
                });
            case 'feedback_content':
                value.$kind = value.$.val;
                return check(value.$name, this.deserializeFeedbackContent(value));
            case 'feedback': {
                let objectId;
                if (value.$['object'] === 'state')
                    objectId = { objectKind: "stateid", stateId: +value['state_id'] };
                else if (value.$['object'] === 'edit')
                    objectId = { objectKind: "editid", editId: +value['edit_id'] };
                const result = Object.assign({
                    objectId: objectId,
                    route: +(value.$.route || "0"),
                }, value.$children[1]) /* TODO: TS 2.1 will equate A&(B|C)=(A&B)|(A&C) so this cast will not be necessary */;
                return check(value.$name, result);
            }
            default:
                return unreachable(value);
        }
    }
    deserializeFeedbackContent(value) {
        return this.doDeserializeFeedbackContent(value);
    }
    doDeserializeFeedbackContent(value) {
        let result;
        switch (value.$kind) {
            case 'workerstatus': {
                let statusStr = value.$children[0][1];
                let reSearch = /^(?:proof:[ ]*)(.*)/.exec(statusStr);
                if (reSearch)
                    result = {
                        feedbackKind: "worker-status",
                        id: value.$children[0][0],
                        state: coqProto.WorkerState.Proof,
                        ident: reSearch[1]
                    };
                else
                    result = {
                        feedbackKind: "worker-status",
                        id: value.$children[0][0],
                        state: coqProto.WorkerState[statusStr]
                    };
                return result;
            }
            case 'filedependency': {
                let file = value.$children[0] || "";
                let dependency = value.$children[1];
                result = {
                    feedbackKind: "file-dependency",
                    source: file,
                    dependsOn: dependency,
                };
                return result;
            }
            case 'fileloaded':
                result = {
                    feedbackKind: "file-loaded",
                    module: value.$children[0],
                    filename: value.$children[1]
                };
                return result;
            // (Feedback.GlobRef (loc, filepath, modpath, ident, ty))
            // Feedback.feedback (Feedback.GlobDef (loc, id, secpath, ty))
            case 'globref':
                result = {
                    feedbackKind: 'glob-ref',
                    location: value.$children[0],
                    filePath: value.$children[1],
                    modulePath: value.$children[2],
                    identity: value.$children[3],
                    type: value.$children[4],
                };
                console.log("glob-ref: " + util.inspect(result));
                return result;
            case 'globdef':
                result = {
                    feedbackKind: 'glob-def',
                    location: value.$children[0],
                    identity: value.$children[1],
                    secPath: value.$children[2],
                    type: value.$children[3],
                };
                console.log("glob-def: " + util.inspect(result));
                return result;
            case 'message':
                return {
                    feedbackKind: "message",
                    level: value.$children[0].level,
                    location: value.$children[0].location,
                    message: value.$children[0].message,
                };
            case 'errormsg':
                return {
                    feedbackKind: "message",
                    level: coqProto.MessageLevel.Error,
                    location: value.$children[0],
                    message: value.$children[1]
                };
            case 'addedaxiom':
            case 'processed':
            case 'incomplete':
            case 'complete':
                result = {
                    feedbackKind: 'sentence-status',
                    status: coq_proto_1.SentenceStatus[value.$.val],
                    worker: "",
                    inProgressDelta: 0,
                };
                return result;
            case 'inprogress':
                result = {
                    feedbackKind: 'sentence-status',
                    status: coq_proto_1.SentenceStatus[value.$.val],
                    worker: "",
                    inProgressDelta: value.$children[0],
                };
                return result;
            case 'processingin':
                result = {
                    feedbackKind: 'sentence-status',
                    status: coq_proto_1.SentenceStatus[value.$.val],
                    worker: value.$children[0],
                    inProgressDelta: 0,
                };
                return result;
            case 'custom': {
                if (value.$children[1] === 'ltacprof_results')
                    result = Object.assign({ feedbackKind: "ltacprof" }, value.$children[2]);
                else
                    result = {
                        feedbackKind: "custom",
                        location: value.$children[0],
                        type: value.$children[1],
                        data: value.$children[2],
                    };
                return result;
            }
            default:
                result = {
                    feedbackKind: "unknown",
                    data: value,
                };
                return result;
        }
    }
}
exports.Deserialize = Deserialize;
//# sourceMappingURL=deserialize.base.js.map