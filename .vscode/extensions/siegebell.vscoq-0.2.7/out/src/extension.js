'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode = require('vscode');
const proto = require('./protocol');
const CoqProject_1 = require('./CoqProject');
const snippets = require('./Snippets');
const Decorations_1 = require('./Decorations');
const HtmlCoqView_1 = require('./HtmlCoqView');
const editorAssist = require('./EditorAssist');
vscode.Range.prototype.toString = function rangeToString() { return `[${this.start.toString()},${this.end.toString()})`; };
vscode.Position.prototype.toString = function positionToString() { return `{${this.line}@${this.character}}`; };
console.log(`Coq Extension: process.version: ${process.version}, process.arch: ${process.arch}}`);
let project;
// export function activate(context: ExtensionContext) {
//   const dec = vscode.window.createTextEditorDecorationType({
//     before: {contentText: "_$_", textDecoration: 'none; letter-spacing: normal; overflow: visible; font-size: 10em'},
//     textDecoration: 'none; font-size: 0.1em; letter-spacing: -0.55em; overflow: hidden; width: 0px; visibility: hidden',
//     // before: {contentText: "WORD", textDecoration: 'none; content: "WORD2"'},
//     // textDecoration: 'none; content: url(file:///C:/Users/cj/Research/vscoq/client/images/1x1.png)',
//     // textDecoration: 'none; position: absolute !important; top: -9999px !important; left: -9999px !important; letter-spacing: -1px',
//   });
//   function lineRange(line, start, end) { return new vscode.Range(line,start,line,end) }
//   const editor = vscode.window.activeTextEditor;
//   if (editor) {
//     const lines = [
//       "line1",
//       "small word: word",
//       "try selecting the previous line",
//       "END OF EXAMPLE", "", "", ]
//     editor.edit((edit) => {
//       edit.insert(new vscode.Position(0,0), lines.join('\n'));
//     }).then(() => {
//       editor.setDecorations(dec, [lineRange(1,12,16)]);
//     });
//   }  
// }
function activate(context) {
    console.log(`execArgv: ${process.execArgv.join(' ')}`);
    console.log(`argv: ${process.argv.join(' ')}`);
    exports.extensionContext = context;
    project = CoqProject_1.CoqProject.create(context);
    context.subscriptions.push(project);
    function regTCmd(command, callback) {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand('extension.coq.' + command, callback));
    }
    function regCmd(command, callback, thisArg) {
        context.subscriptions.push(vscode.commands.registerCommand('extension.coq.' + command, callback, thisArg));
    }
    function regProjectCmd(command, callback) {
        context.subscriptions.push(vscode.commands.registerCommand('extension.coq.' + command, callback, project));
    }
    Decorations_1.initializeDecorations(context);
    regProjectCmd('quit', project.quitCoq);
    regProjectCmd('reset', project.resetCoq);
    regProjectCmd('interrupt', project.interruptCoq);
    regProjectCmd('finishComputations', project.finishComputations);
    regProjectCmd('stepForward', project.stepForward);
    regProjectCmd('stepBackward', project.stepBackward);
    regProjectCmd('interpretToPoint', project.interpretToPoint);
    regProjectCmd('interpretToPointSynchronous', () => project.interpretToPoint({ synchronous: true }));
    regProjectCmd('interpretToEnd', project.interpretToEnd);
    regProjectCmd('interpretToEndSynchronous', () => project.interpretToEnd({ synchronous: true }));
    regProjectCmd('moveCursorToFocus', project.setCursorToFocus);
    regTCmd('query.check', check);
    regTCmd('query.locate', locate);
    regTCmd('query.search', search);
    regTCmd('query.searchAbout', searchAbout);
    regTCmd('query.print', print);
    regTCmd('query.prompt.check', queryCheck);
    regTCmd('query.prompt.locate', queryLocate);
    regTCmd('query.prompt.search', querySearch);
    regTCmd('query.prompt.searchAbout', querySearchAbout);
    regTCmd('query.prompt.print', queryPrint);
    regTCmd('proofView.viewStateAt', viewProofStateAt);
    regTCmd('proofView.open', viewCurrentProofState);
    regTCmd('proofView.openExternal', viewProofStateExternal);
    regCmd('proofView.customizeProofViewStyle', customizeProofViewStyle);
    regProjectCmd('ltacProf.getResults', project.ltacProfGetResults);
    regCmd('display.toggle.implicitArguments', () => project.setDisplayOption(proto.DisplayOption.ImplicitArguments, proto.SetDisplayOption.Toggle));
    regCmd('display.toggle.coercions', () => project.setDisplayOption(proto.DisplayOption.Coercions, proto.SetDisplayOption.Toggle));
    regCmd('display.toggle.rawMatchingExpressions', () => project.setDisplayOption(proto.DisplayOption.RawMatchingExpressions, proto.SetDisplayOption.Toggle));
    regCmd('display.toggle.notations', () => project.setDisplayOption(proto.DisplayOption.Notations, proto.SetDisplayOption.Toggle));
    regCmd('display.toggle.allBasicLowLevelContents', () => project.setDisplayOption(proto.DisplayOption.AllBasicLowLevelContents, proto.SetDisplayOption.Toggle));
    regCmd('display.toggle.existentialVariableInstances', () => project.setDisplayOption(proto.DisplayOption.ExistentialVariableInstances, proto.SetDisplayOption.Toggle));
    regCmd('display.toggle.universeLevels', () => project.setDisplayOption(proto.DisplayOption.UniverseLevels, proto.SetDisplayOption.Toggle));
    regCmd('display.toggle.allLowLevelContents', () => project.setDisplayOption(proto.DisplayOption.AllLowLevelContents, proto.SetDisplayOption.Toggle));
    regCmd('display.toggle', () => project.setDisplayOption());
    context.subscriptions.push(editorAssist.reload());
    snippets.setupSnippets(context.subscriptions);
}
exports.activate = activate;
function withDocAsync(editor, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = project.getOrCurrent(editor ? editor.document.uri.toString() : null);
        if (doc)
            yield callback(doc);
    });
}
function queryStringFromPlaceholder(prompt, editor) {
    return __awaiter(this, void 0, void 0, function* () {
        let placeHolder = editor.document.getText(editor.selection);
        if (editor.selection.isEmpty)
            placeHolder = editor.document.getText(editor.document.getWordRangeAtPosition(editor.selection.active));
        return yield vscode.window.showInputBox({
            prompt: prompt,
            value: placeHolder
        });
    });
}
function queryStringFromPosition(prompt, editor) {
    return __awaiter(this, void 0, void 0, function* () {
        let query = editor.document.getText(editor.selection);
        if (editor.selection.isEmpty)
            query = editor.document.getText(editor.document.getWordRangeAtPosition(editor.selection.active));
        if (query.trim() === "")
            return yield queryStringFromPlaceholder(prompt, editor);
        else
            return query;
    });
}
function queryCheck(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.check(yield queryStringFromPlaceholder("Check:", editor));
    }));
}
function queryLocate(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.locate(yield queryStringFromPlaceholder("Locate:", editor));
    }));
}
function querySearch(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.search(yield queryStringFromPlaceholder("Search:", editor));
    }));
}
function querySearchAbout(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.searchAbout(yield queryStringFromPlaceholder("Search About:", editor));
    }));
}
function queryPrint(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.print(yield queryStringFromPlaceholder("Print:", editor));
    }));
}
function check(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.check(yield queryStringFromPosition("Check:", editor));
    }));
}
function locate(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.locate(yield queryStringFromPosition("Locate:", editor));
    }));
}
function search(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.search(yield queryStringFromPosition("Search:", editor));
    }));
}
function searchAbout(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.searchAbout(yield queryStringFromPosition("Search About:", editor));
    }));
}
function print(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.print(yield queryStringFromPosition("Search About:", editor));
    }));
}
function viewProofStateAt(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.viewGoalAt(editor);
    }));
}
function viewCurrentProofState(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.viewGoalState(editor, false);
    }));
}
function viewProofStateExternal(editor, edit) {
    return withDocAsync(editor, (doc) => __awaiter(this, void 0, void 0, function* () {
        return doc.viewGoalState(editor, true);
    }));
}
function customizeProofViewStyle() {
    HtmlCoqView_1.HtmlCoqView.customizeProofViewStyle();
}
//# sourceMappingURL=extension.js.map