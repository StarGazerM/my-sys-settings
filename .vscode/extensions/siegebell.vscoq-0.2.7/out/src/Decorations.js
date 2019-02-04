'use strict';
const vscode = require('vscode');
const STM_FOCUS_IMAGE = "./images/stm-focus.svg";
const STM_FOCUS_IMAGE_BEFORE = "./images/stm-focus-before.svg";
let decorationsInteral;
function initializeDecorations(context) {
    function create(style) {
        const result = vscode.window.createTextEditorDecorationType(style);
        context.subscriptions.push(result);
        return result;
    }
    decorationsInteral = {
        parsing: create({
            outlineWidth: '1px',
            outlineStyle: 'solid',
            overviewRulerColor: 'cyan',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            light: { outlineColor: 'rgba(32, 165, 218,0.7)', backgroundColor: 'rgba(0, 255, 255, 0.2)' },
            dark: { outlineColor: 'rgba(32, 165, 218,0.7)', backgroundColor: 'rgba(0, 255, 255, 0.2)' },
        }),
        processing: create({
            overviewRulerColor: 'blue',
            overviewRulerLane: vscode.OverviewRulerLane.Center,
            light: { backgroundColor: 'rgba(0,0,255,0.3)' },
            dark: { backgroundColor: 'rgba(0,0,255,0.3)' },
        }),
        stateError: create({
            borderWidth: '1px',
            borderStyle: 'solid',
            light: { borderColor: 'rgba(255,0,0,0.5)',
                backgroundColor: 'rgba(255,0,0,0.25)'
            },
            dark: { borderColor: 'rgba(255,0,0,0.5)',
                backgroundColor: 'rgba(255,0,0,0.25)'
            },
        }),
        processed: create({
            overviewRulerColor: 'green',
            overviewRulerLane: vscode.OverviewRulerLane.Center,
            light: { backgroundColor: 'rgba(0,150,0,0.2)' },
            dark: { backgroundColor: 'rgba(0,150,0,0.2)' },
        }),
        axiom: create({
            overviewRulerColor: 'yellow',
            overviewRulerLane: vscode.OverviewRulerLane.Center,
            light: { backgroundColor: 'rgba(180,180,0,0.7)' },
            dark: { backgroundColor: 'rgba(120,120,0,0.7)' },
        }),
        incomplete: create({
            overviewRulerColor: 'purple',
            overviewRulerLane: vscode.OverviewRulerLane.Center,
            light: { backgroundColor: 'violet' },
            dark: { backgroundColor: 'darkmagenta' },
        }),
        focus: create({
            gutterIconPath: context.asAbsolutePath(STM_FOCUS_IMAGE),
            gutterIconSize: "contain"
        }),
        focusBefore: create({
            gutterIconPath: context.asAbsolutePath(STM_FOCUS_IMAGE_BEFORE),
            gutterIconSize: "contain"
        })
    };
    exports.decorations = decorationsInteral;
}
exports.initializeDecorations = initializeDecorations;
//# sourceMappingURL=Decorations.js.map