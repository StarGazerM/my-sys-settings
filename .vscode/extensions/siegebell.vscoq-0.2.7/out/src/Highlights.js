'use strict';
const vscode = require('vscode');
const proto = require('./protocol');
const Decorations_1 = require('./Decorations');
function toRange(range) {
    return new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
}
class Highlights {
    constructor() {
        // private textHighlights : {decoration: vscode.TextEditorDecorationType, ranges: RangeSet}[] = [];
        // private textHighlights : vscode.TextEditorDecorationType[];
        this.current = { ranges: [[], [], [], [], [], []] };
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
                highlights.ranges[5].map(toRange)
            ] };
        this.applyCurrent(editors);
    }
    clearAll(editors) {
        this.current = { ranges: [[], [], [], [], [], []] };
        this.applyCurrent(editors);
    }
    refresh(editors) {
        this.applyCurrent(editors);
    }
    applyCurrent(editors) {
        for (let editor of editors) {
            editor.setDecorations(Decorations_1.decorations.stateError, this.current.ranges[proto.HighlightType.StateError]);
            editor.setDecorations(Decorations_1.decorations.parsing, this.current.ranges[proto.HighlightType.Parsing]);
            editor.setDecorations(Decorations_1.decorations.processing, this.current.ranges[proto.HighlightType.Processing]);
            editor.setDecorations(Decorations_1.decorations.incomplete, this.current.ranges[proto.HighlightType.Incomplete]);
            editor.setDecorations(Decorations_1.decorations.axiom, this.current.ranges[proto.HighlightType.Axiom]);
            editor.setDecorations(Decorations_1.decorations.processed, this.current.ranges[proto.HighlightType.Processed]);
        }
    }
}
exports.Highlights = Highlights;
//# sourceMappingURL=Highlights.js.map