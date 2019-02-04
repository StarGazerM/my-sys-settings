'use strict';
function hasStateId(objectId) {
    return objectId.objectKind === "stateid";
}
exports.hasStateId = hasStateId;
// export type StateFeedback2 =
//   (WorkerStatus | (CustomFeedback&FeedbackBase) | SentenceFeedback | MessageFeedback | FileLoaded | FileDependency | GlobReference | GlobDefinition | UnknownFeedback)
//   & FeedbackBase;
// export interface StateFeedback {
//   stateId : number;
//   route : number;
//   workerStatus?: WorkerStatus[];
//   fileDependencies?: Map<string,string[]>;
//   fileLoaded?: FileLoaded;
//   sentenceFeedback?: SentenceFeedback;
//   custom?: CustomFeedback
//   error?: ErrorMessage;
// }
(function (WorkerState) {
    WorkerState[WorkerState["Idle"] = 0] = "Idle";
    WorkerState[WorkerState["Processing"] = 1] = "Processing";
    WorkerState[WorkerState["Dead"] = 2] = "Dead";
    WorkerState[WorkerState["Proof"] = 3] = "Proof";
})(exports.WorkerState || (exports.WorkerState = {}));
var WorkerState = exports.WorkerState;
;
(function (SentenceStatus) {
    SentenceStatus[SentenceStatus["Parsing"] = 0] = "Parsing";
    SentenceStatus[SentenceStatus["ProcessingInWorker"] = 1] = "ProcessingInWorker";
    SentenceStatus[SentenceStatus["Processed"] = 2] = "Processed";
    SentenceStatus[SentenceStatus["InProgress"] = 3] = "InProgress";
    SentenceStatus[SentenceStatus["Incomplete"] = 4] = "Incomplete";
    SentenceStatus[SentenceStatus["Complete"] = 5] = "Complete";
    SentenceStatus[SentenceStatus["AddedAxiom"] = 6] = "AddedAxiom";
    // NOTE!
    // Coq uses IDs like 'processingin'; the below lets us convert into SentenceStatus
    SentenceStatus[SentenceStatus["processingin"] = 1] = "processingin";
    SentenceStatus[SentenceStatus["processed"] = 2] = "processed";
    SentenceStatus[SentenceStatus["inprogress"] = 3] = "inprogress";
    SentenceStatus[SentenceStatus["incomplete"] = 4] = "incomplete";
    SentenceStatus[SentenceStatus["complete"] = 5] = "complete";
    SentenceStatus[SentenceStatus["addedaxiom"] = 6] = "addedaxiom";
})(exports.SentenceStatus || (exports.SentenceStatus = {}));
var SentenceStatus = exports.SentenceStatus;
;
(function (MessageLevel) {
    MessageLevel[MessageLevel["Warning"] = 0] = "Warning";
    MessageLevel[MessageLevel["warning"] = 0] = "warning";
    MessageLevel[MessageLevel["Info"] = 1] = "Info";
    MessageLevel[MessageLevel["info"] = 1] = "info";
    MessageLevel[MessageLevel["Notice"] = 2] = "Notice";
    MessageLevel[MessageLevel["notice"] = 2] = "notice";
    MessageLevel[MessageLevel["Error"] = 3] = "Error";
    MessageLevel[MessageLevel["error"] = 3] = "error";
    MessageLevel[MessageLevel["Debug"] = 4] = "Debug";
    MessageLevel[MessageLevel["debug"] = 4] = "debug";
})(exports.MessageLevel || (exports.MessageLevel = {}));
var MessageLevel = exports.MessageLevel;
function GetValue(x, value) {
    if (value.status !== "good")
        throw "Cannot get value of failed command";
    switch (x) {
        case 'Add': {
            let v = value.result;
            return { assignedState: v[0], nextFocusState: v[1][0].tag === 'inr' ? v[1][0].value : undefined, message: v[0][0] };
        }
        case 'Edit_at': {
            let v = value.result;
            if (v.tag === 'inl')
                return null;
            else
                return { focusedState: v.value[0], focusedQedState: v.value[1][0], oldFocusedState: v.value[1][1] };
        }
        case 'Goal': {
            return value.result;
        }
        case 'Query': {
            return value.result;
        }
        case 'Evars': {
            return value.result || [];
        }
        case 'Hints': {
            let v = value.result;
            return { hintsA: v[0], hintB: v[1] };
        }
        case 'Status': {
            return value.result;
        }
        case 'Search': {
            return value.result;
        }
        case 'GetOptions': {
            const v = value.result;
            return new Map(v.map((x) => [x[0], x[1]]));
        }
        case 'SetOptions': {
            return;
        }
        case 'MkCases': {
            return value.result;
        }
        case 'Quit': {
            return;
        }
        case 'About': {
            return value.result;
        }
        case 'Init': {
            return value.result;
        }
        case 'value.result': {
            const v = value.result;
            return {
                assignedState: v[0],
                tag: v[1].tag,
                value: v[1].value,
            };
        }
        case 'StopWorker': {
            return;
        }
        case 'PrintAst': {
            return;
        }
        case 'Annotate':
            return;
        default: return undefined;
    }
}
exports.GetValue = GetValue;
//# sourceMappingURL=coq-proto.js.map