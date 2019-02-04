'use strict';
const vscode = require('vscode');
(function (DisplayState) {
    DisplayState[DisplayState["Proof"] = 0] = "Proof";
    DisplayState[DisplayState["Top"] = 1] = "Top";
    DisplayState[DisplayState["Error"] = 2] = "Error";
})(exports.DisplayState || (exports.DisplayState = {}));
var DisplayState = exports.DisplayState;
function getDisplayState(state) {
    switch (state.type) {
        case 'failure':
            return DisplayState.Error;
        case 'proof-view':
            return DisplayState.Proof;
        case 'interrupted':
            return DisplayState.Error;
        case 'no-proof':
            return DisplayState.Top;
    }
}
exports.getDisplayState = getDisplayState;
function countUnfocusedGoalStack(u) {
    if (u)
        return u.before.length + u.after.length + countUnfocusedGoalStack(u.next);
    else
        return 0;
}
function countAllGoals(state) {
    if (state.type === 'proof-view') {
        const result = state.goals.length
            + countUnfocusedGoalStack(state.backgroundGoals)
            + state.abandonedGoals.length
            + state.shelvedGoals.length;
        return result;
    }
    else
        return 0;
}
exports.countAllGoals = countAllGoals;
function adjacentPane(pane) {
    switch (pane) {
        case vscode.ViewColumn.One: return vscode.ViewColumn.Two;
        case vscode.ViewColumn.Two: return vscode.ViewColumn.Three;
        case vscode.ViewColumn.Three: return vscode.ViewColumn.Two;
    }
}
exports.adjacentPane = adjacentPane;
//# sourceMappingURL=CoqView.js.map