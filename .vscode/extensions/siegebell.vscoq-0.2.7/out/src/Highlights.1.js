'use strict';
const vscode = require('vscode');
const proto = require('./protocol');
function toRange(range) {
    return new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
}
// export enum HighlightType {
//   Clear,  SyntaxError,  TacticFailure,  Parsing,  Processing, Incomplete, Complete, InProgress, Processed 
// }
const parsingTextDecoration = vscode.window.createTextEditorDecorationType({
    outlineWidth: '1px',
    outlineStyle: 'solid',
    overviewRulerColor: 'yellow',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: { outlineColor: 'rgba(218, 165, 32,0.7)', backgroundColor: 'rgba(255, 255, 0,0.2)' },
    dark: { outlineColor: 'rgba(218, 165, 32,0.7)', backgroundColor: 'rgba(255, 255, 0,0.2)' },
});
const processingTextDecoration = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: 'blue',
    overviewRulerLane: vscode.OverviewRulerLane.Center,
    light: { backgroundColor: 'rgba(0,0,255,0.3)' },
    dark: { backgroundColor: 'rgba(0,0,255,0.3)' },
});
const stateErrorTextDecoration = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderStyle: 'solid',
    light: { borderColor: 'rgba(255,0,0,0.5)',
        backgroundColor: 'rgba(255,0,0,0.25)'
    },
    dark: { borderColor: 'rgba(255,0,0,0.5)',
        backgroundColor: 'rgba(255,0,0,0.25)'
    },
});
const processedTextDecoration = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: 'green',
    overviewRulerLane: vscode.OverviewRulerLane.Center,
    light: { backgroundColor: 'rgba(0,150,0,0.2)' },
    dark: { backgroundColor: 'rgba(0,150,0,0.2)' },
});
// Example: a Qed. whose proof failed.
const incompleteTextDecoration = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: 'yellow',
    overviewRulerLane: vscode.OverviewRulerLane.Center,
    light: { backgroundColor: 'rgba(255,255,0,0.2)' },
    dark: { backgroundColor: 'rgba(255,255,0,0.2)' },
});
const completeTextDecoration = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: 'green',
    overviewRulerLane: vscode.OverviewRulerLane.Center,
    light: { backgroundColor: 'rgba(0,255,255,0.2)' },
    dark: { backgroundColor: 'rgba(0,255,255,0.2)' },
});
const inProgressTextDecoration = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: 'purple',
    overviewRulerLane: vscode.OverviewRulerLane.Center,
    light: { backgroundColor: 'lightpurple' },
    dark: { backgroundColor: 'darkpurple' },
});
let focusDecoration;
let focusBeforeDecoration;
function initializeDecorations(context) {
}
exports.initializeDecorations = initializeDecorations;
class Highlights {
    constructor() {
        // private textHighlights : {decoration: vscode.TextEditorDecorationType, ranges: RangeSet}[] = [];
        // private textHighlights : vscode.TextEditorDecorationType[];
        this.current = { ranges: [[], [], [], [], [], [], []] };
        // this.textHighlights[proto.HighlightType.Parsing   ] = parsingTextDecoration;
        // this.textHighlights[proto.HighlightType.Processing] = processingTextDecoration;
        // this.textHighlights[proto.HighlightType.StateError] = stateErrorTextDecoration;
        // this.textHighlights[proto.HighlightType.Processed ] = processedTextDecoration;
        // this.textHighlights[proto.HighlightType.Incomplete] = incompleteTextDecoration;
        // this.textHighlights[proto.HighlightType.Complete  ] = completeTextDecoration;
        // this.textHighlights[proto.HighlightType.InProgress] = inProgressTextDecoration;
    }
    set(editors, highlights) {
        this.current = { ranges: [highlights.ranges[0].map(toRange),
                highlights.ranges[1].map(toRange),
                highlights.ranges[2].map(toRange),
                highlights.ranges[3].map(toRange),
                highlights.ranges[4].map(toRange),
                highlights.ranges[5].map(toRange),
                highlights.ranges[6].map(toRange)
            ] };
        this.applyCurrent(editors);
    }
    clearAll(editors) {
        this.current = { ranges: [[], [], [], [], [], [], []] };
        this.applyCurrent(editors);
    }
    refresh(editors) {
        this.applyCurrent(editors);
    }
    applyCurrent(editors) {
        for (let editor of editors) {
            editor.setDecorations(stateErrorTextDecoration, this.current.ranges[proto.HighlightType.StateError]);
            editor.setDecorations(parsingTextDecoration, this.current.ranges[proto.HighlightType.Parsing]);
            editor.setDecorations(processingTextDecoration, this.current.ranges[proto.HighlightType.Processing]);
            editor.setDecorations(incompleteTextDecoration, this.current.ranges[proto.HighlightType.Incomplete]);
            editor.setDecorations(completeTextDecoration, this.current.ranges[proto.HighlightType.Complete]);
            editor.setDecorations(inProgressTextDecoration, this.current.ranges[proto.HighlightType.InProgress]);
            editor.setDecorations(processedTextDecoration, this.current.ranges[proto.HighlightType.Processed]);
        }
    }
}
exports.Highlights = Highlights;
//# sourceMappingURL=Highlights.1.js.map