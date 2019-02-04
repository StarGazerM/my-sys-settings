'use strict';
(function (SetDisplayOption) {
    SetDisplayOption[SetDisplayOption["On"] = 0] = "On";
    SetDisplayOption[SetDisplayOption["Off"] = 1] = "Off";
    SetDisplayOption[SetDisplayOption["Toggle"] = 2] = "Toggle";
})(exports.SetDisplayOption || (exports.SetDisplayOption = {}));
var SetDisplayOption = exports.SetDisplayOption;
(function (DisplayOption) {
    DisplayOption[DisplayOption["ImplicitArguments"] = 0] = "ImplicitArguments";
    DisplayOption[DisplayOption["Coercions"] = 1] = "Coercions";
    DisplayOption[DisplayOption["RawMatchingExpressions"] = 2] = "RawMatchingExpressions";
    DisplayOption[DisplayOption["Notations"] = 3] = "Notations";
    DisplayOption[DisplayOption["AllBasicLowLevelContents"] = 4] = "AllBasicLowLevelContents";
    DisplayOption[DisplayOption["ExistentialVariableInstances"] = 5] = "ExistentialVariableInstances";
    DisplayOption[DisplayOption["UniverseLevels"] = 6] = "UniverseLevels";
    DisplayOption[DisplayOption["AllLowLevelContents"] = 7] = "AllLowLevelContents";
})(exports.DisplayOption || (exports.DisplayOption = {}));
var DisplayOption = exports.DisplayOption;
(function (HypothesisDifference) {
    HypothesisDifference[HypothesisDifference["None"] = 0] = "None";
    HypothesisDifference[HypothesisDifference["Changed"] = 1] = "Changed";
    HypothesisDifference[HypothesisDifference["New"] = 2] = "New";
    HypothesisDifference[HypothesisDifference["MovedUp"] = 3] = "MovedUp";
    HypothesisDifference[HypothesisDifference["MovedDown"] = 4] = "MovedDown";
})(exports.HypothesisDifference || (exports.HypothesisDifference = {}));
var HypothesisDifference = exports.HypothesisDifference;
var InterruptCoqRequest;
(function (InterruptCoqRequest) {
    InterruptCoqRequest.type = { get method() { return 'coqtop/interrupt'; },
        _: undefined
    };
})(InterruptCoqRequest = exports.InterruptCoqRequest || (exports.InterruptCoqRequest = {}));
var QuitCoqRequest;
(function (QuitCoqRequest) {
    QuitCoqRequest.type = { get method() { return 'coqtop/quitCoq'; },
        _: undefined };
})(QuitCoqRequest = exports.QuitCoqRequest || (exports.QuitCoqRequest = {}));
var ResetCoqRequest;
(function (ResetCoqRequest) {
    ResetCoqRequest.type = { get method() { return 'coqtop/resetCoq'; },
        _: undefined };
})(ResetCoqRequest = exports.ResetCoqRequest || (exports.ResetCoqRequest = {}));
var StepForwardRequest;
(function (StepForwardRequest) {
    StepForwardRequest.type = { get method() { return 'coqtop/stepForward'; },
        _: undefined };
})(StepForwardRequest = exports.StepForwardRequest || (exports.StepForwardRequest = {}));
var StepBackwardRequest;
(function (StepBackwardRequest) {
    StepBackwardRequest.type = { get method() { return 'coqtop/stepBackward'; },
        _: undefined };
})(StepBackwardRequest = exports.StepBackwardRequest || (exports.StepBackwardRequest = {}));
var InterpretToPointRequest;
(function (InterpretToPointRequest) {
    InterpretToPointRequest.type = { get method() { return 'coqtop/interpretToPoint'; },
        _: undefined };
})(InterpretToPointRequest = exports.InterpretToPointRequest || (exports.InterpretToPointRequest = {}));
var InterpretToEndRequest;
(function (InterpretToEndRequest) {
    InterpretToEndRequest.type = { get method() { return 'coqtop/interpretToEnd'; },
        _: undefined };
})(InterpretToEndRequest = exports.InterpretToEndRequest || (exports.InterpretToEndRequest = {}));
var GoalRequest;
(function (GoalRequest) {
    GoalRequest.type = { get method() { return 'coqtop/goal'; },
        _: undefined };
})(GoalRequest = exports.GoalRequest || (exports.GoalRequest = {}));
var CachedGoalRequest;
(function (CachedGoalRequest) {
    CachedGoalRequest.type = { get method() { return 'coqtop/cachedGoal'; },
        _: undefined };
})(CachedGoalRequest = exports.CachedGoalRequest || (exports.CachedGoalRequest = {}));
var FinishComputationsRequest;
(function (FinishComputationsRequest) {
    FinishComputationsRequest.type = { get method() { return 'coqtop/finishComputations'; },
        _: undefined };
})(FinishComputationsRequest = exports.FinishComputationsRequest || (exports.FinishComputationsRequest = {}));
var QueryRequest;
(function (QueryRequest) {
    QueryRequest.type = { get method() { return 'coqtop/query'; },
        _: undefined };
})(QueryRequest = exports.QueryRequest || (exports.QueryRequest = {}));
(function (QueryFunction) {
    QueryFunction[QueryFunction["Check"] = 0] = "Check";
    QueryFunction[QueryFunction["Print"] = 1] = "Print";
    QueryFunction[QueryFunction["Search"] = 2] = "Search";
    QueryFunction[QueryFunction["SearchAbout"] = 3] = "SearchAbout";
    QueryFunction[QueryFunction["Locate"] = 4] = "Locate";
})(exports.QueryFunction || (exports.QueryFunction = {}));
var QueryFunction = exports.QueryFunction;
var ResizeWindowRequest;
(function (ResizeWindowRequest) {
    ResizeWindowRequest.type = { get method() { return 'coqtop/resizeWindow'; },
        _: undefined };
})(ResizeWindowRequest = exports.ResizeWindowRequest || (exports.ResizeWindowRequest = {}));
var SetDisplayOptionsRequest;
(function (SetDisplayOptionsRequest) {
    SetDisplayOptionsRequest.type = { get method() { return 'coqtop/setDisplayOptions'; },
        _: undefined };
})(SetDisplayOptionsRequest = exports.SetDisplayOptionsRequest || (exports.SetDisplayOptionsRequest = {}));
var LtacProfResultsRequest;
(function (LtacProfResultsRequest) {
    LtacProfResultsRequest.type = { get method() { return 'coqtop/ltacProfResults'; },
        _: undefined };
})(LtacProfResultsRequest = exports.LtacProfResultsRequest || (exports.LtacProfResultsRequest = {}));
var GetSentencePrefixTextRequest;
(function (GetSentencePrefixTextRequest) {
    GetSentencePrefixTextRequest.type = { get method() { return 'coqtop/getSentencePrefixText'; },
        _: undefined };
})(GetSentencePrefixTextRequest = exports.GetSentencePrefixTextRequest || (exports.GetSentencePrefixTextRequest = {}));
(function (HighlightType) {
    HighlightType[HighlightType["StateError"] = 0] = "StateError";
    HighlightType[HighlightType["Parsing"] = 1] = "Parsing";
    HighlightType[HighlightType["Processing"] = 2] = "Processing";
    HighlightType[HighlightType["Incomplete"] = 3] = "Incomplete";
    HighlightType[HighlightType["Processed"] = 4] = "Processed";
    HighlightType[HighlightType["Axiom"] = 5] = "Axiom";
})(exports.HighlightType || (exports.HighlightType = {}));
var HighlightType = exports.HighlightType;
var UpdateHighlightsNotification;
(function (UpdateHighlightsNotification) {
    UpdateHighlightsNotification.type = { get method() { return 'coqtop/updateHighlights'; },
        _: undefined };
})(UpdateHighlightsNotification = exports.UpdateHighlightsNotification || (exports.UpdateHighlightsNotification = {}));
var CoqMessageNotification;
(function (CoqMessageNotification) {
    CoqMessageNotification.type = { get method() { return 'coqtop/message'; },
        _: undefined };
})(CoqMessageNotification = exports.CoqMessageNotification || (exports.CoqMessageNotification = {}));
var CoqResetNotification;
(function (CoqResetNotification) {
    CoqResetNotification.type = { get method() { return 'coqtop/wasReset'; },
        _: undefined };
})(CoqResetNotification = exports.CoqResetNotification || (exports.CoqResetNotification = {}));
var CoqStmFocusNotification;
(function (CoqStmFocusNotification) {
    CoqStmFocusNotification.type = { get method() { return 'coqtop/stmFocus'; },
        _: undefined };
})(CoqStmFocusNotification = exports.CoqStmFocusNotification || (exports.CoqStmFocusNotification = {}));
(function (ComputingStatus) {
    ComputingStatus[ComputingStatus["Finished"] = 0] = "Finished";
    ComputingStatus[ComputingStatus["Computing"] = 1] = "Computing";
    ComputingStatus[ComputingStatus["Interrupted"] = 2] = "Interrupted";
})(exports.ComputingStatus || (exports.ComputingStatus = {}));
var ComputingStatus = exports.ComputingStatus;
var CoqLtacProfResultsNotification;
(function (CoqLtacProfResultsNotification) {
    CoqLtacProfResultsNotification.type = { get method() { return 'coqtop/ltacProfResults'; },
        _: undefined };
})(CoqLtacProfResultsNotification = exports.CoqLtacProfResultsNotification || (exports.CoqLtacProfResultsNotification = {}));
//# sourceMappingURL=protocol.js.map