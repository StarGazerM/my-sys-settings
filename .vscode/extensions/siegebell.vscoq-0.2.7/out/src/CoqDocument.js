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
const Decorations_1 = require('./Decorations');
const Highlights_1 = require('./Highlights');
const HtmlCoqView_1 = require('./HtmlCoqView');
const HtmlLtacProf_1 = require('./HtmlLtacProf');
const proto = require('./protocol');
const textUtil = require('./text-util');
const extension_1 = require('./extension');
const CoqLanguageServer_1 = require('./CoqLanguageServer');
const CoqView_1 = require('./CoqView');
const StatusBar_1 = require('./StatusBar');
const text = require('./AnnotatedText');
const fs = require('fs');
const path = require('path');
const os = require('os');
var DisplayOptionPicks;
(function (DisplayOptionPicks) {
    DisplayOptionPicks.ImplicitArguments = { label: "Implicit Arguments", description: "toggle display of *implicit arguments*", detail: "some detail", displayItem: proto.DisplayOption.ImplicitArguments };
    DisplayOptionPicks.Coercions = { label: "Coercions", description: "toggle display of *coercions*", displayItem: proto.DisplayOption.Coercions };
    DisplayOptionPicks.RawMatchingExpressions = { label: "Raw Matching Expressions", description: "toggle display of *raw matching expressions*", displayItem: proto.DisplayOption.RawMatchingExpressions };
    DisplayOptionPicks.Notations = { label: "Notations", description: "toggle display of notations", displayItem: proto.DisplayOption.Notations };
    DisplayOptionPicks.AllBasicLowLevelContents = { label: "All Basic Low Level Contents", description: "toggle display of ", displayItem: proto.DisplayOption.AllBasicLowLevelContents };
    DisplayOptionPicks.ExistentialVariableInstances = { label: "Existential Variable Instances", description: "toggle display of ", displayItem: proto.DisplayOption.ExistentialVariableInstances };
    DisplayOptionPicks.UniverseLevels = { label: "Universe Levels", description: "toggle display of ", displayItem: proto.DisplayOption.UniverseLevels };
    DisplayOptionPicks.AllLowLevelContents = { label: "All Low Level Contents", description: "toggle display of ", displayItem: proto.DisplayOption.AllLowLevelContents };
    DisplayOptionPicks.allPicks = [DisplayOptionPicks.ImplicitArguments, DisplayOptionPicks.Coercions, DisplayOptionPicks.RawMatchingExpressions, DisplayOptionPicks.Notations, DisplayOptionPicks.AllBasicLowLevelContents, DisplayOptionPicks.ExistentialVariableInstances, DisplayOptionPicks.UniverseLevels, DisplayOptionPicks.AllLowLevelContents];
})(DisplayOptionPicks || (DisplayOptionPicks = {}));
class CoqDocument {
    constructor(document, project) {
        /** A list of things to dispose */
        this.subscriptions = [];
        this.highlights = new Highlights_1.Highlights();
        this.document = null;
        this.cursorUnmovedSinceCommandInitiated = new Set();
        this.currentLtacProfView = null;
        this.statusBar = new StatusBar_1.StatusBar();
        this.document = document;
        this.project = project;
        // this.document = vscode.workspace.textDocuments.find((doc) => doc.uri === uri);
        this.documentUri = document.uri.toString();
        this.langServer = new CoqLanguageServer_1.CoqDocumentLanguageServer(document.uri.toString());
        this.infoOut = vscode.window.createOutputChannel('Info');
        this.queryOut = vscode.window.createOutputChannel('Query Results');
        this.noticeOut = vscode.window.createOutputChannel('Notices');
        this.view = new HtmlCoqView_1.HtmlCoqView(document.uri, extension_1.extensionContext);
        // this.view = new SimpleCoqView(uri.toString());
        // this.view = new MDCoqView(uri);
        this.view.show(true, CoqView_1.adjacentPane(this.currentViewColumn()));
        this.langServer.onUpdateHighlights((p) => this.onDidUpdateHighlights(p));
        this.langServer.onMessage((p) => this.onCoqMessage(p));
        this.langServer.onReset((p) => this.onCoqReset());
        this.langServer.onUpdateCoqStmFocus((p) => this.updateFocus(p.position));
        this.langServer.onLtacProfResults((p) => this.onLtacProfResults(p));
        this.view.onresize = (columns) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.langServer.resizeView(Math.floor(columns));
                const value = yield this.langServer.getGoal();
                this.view.update(value);
            }
            catch (err) { }
        });
        this.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((e) => {
            if (this.project.settings.autoRevealProofStateAtCursor && e.textEditor.document === this.document && e.selections.length === 1)
                this.viewGoalAt(e.textEditor, e.selections[0].active);
            if (this.cursorUnmovedSinceCommandInitiated.has(e.textEditor))
                this.cursorUnmovedSinceCommandInitiated.delete(e.textEditor);
        }));
        if (vscode.window.activeTextEditor.document.uri.toString() == this.documentUri)
            this.statusBar.focus();
        this.statusBar.setStateReady();
    }
    getUri() {
        return this.documentUri;
    }
    getDocument() {
        return this.document;
    }
    dispose() {
        this.highlights.clearAll(this.allEditors());
        this.statusBar.dispose();
        this.view.dispose();
        this.subscriptions.forEach((d) => d.dispose());
    }
    reset() {
        this.highlights.clearAll(this.allEditors());
    }
    rememberCursors() {
        this.cursorUnmovedSinceCommandInitiated.clear();
        for (let editor of this.allEditors()) {
            this.cursorUnmovedSinceCommandInitiated.add(editor);
        }
    }
    onDidUpdateHighlights(params) {
        this.highlights.set(this.allEditors(), params);
    }
    // private onUpdateComputingStatus(params: proto.NotifyComputingStatusParams) {
    //   this.statusBar.setStateComputing(params.status);
    // }
    onCoqMessage(params) {
        switch (params.level) {
            case 'warning':
                // vscode.window.showWarningMessage(params.message); return;
                this.infoOut.show(true);
                this.infoOut.appendLine(text.textToDisplayString(params.message));
            case 'info':
                // this.infoOut.appendLine(params.message); return;
                // this.view.message(params.message);
                this.infoOut.show(true);
                this.infoOut.appendLine(text.textToDisplayString(params.message));
                return;
            case 'notice':
                this.noticeOut.clear();
                this.noticeOut.show(true);
                this.noticeOut.append(text.textToDisplayString(params.message));
                return;
        }
    }
    onDidChangeTextDocument(params) {
        this.updateFocus(this.focus, false);
    }
    interruptCoq() {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateMessage('Killing CoqTop');
            try {
                yield this.langServer.interruptCoq();
            }
            finally { }
            this.statusBar.setStateReady();
        });
    }
    quitCoq(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateMessage('Killing CoqTop');
            try {
                yield this.langServer.quitCoq();
            }
            finally { }
            this.reset();
            this.statusBar.setStateReady();
        });
    }
    resetCoq(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateMessage('Resetting Coq');
            try {
                yield this.langServer.resetCoq();
            }
            finally { }
            this.reset();
            this.statusBar.setStateReady();
        });
    }
    findEditor() {
        return vscode.window.visibleTextEditors.find((editor, i, a) => editor.document.uri.toString() === this.documentUri);
    }
    allEditors() {
        return vscode.window.visibleTextEditors.filter((editor, i, a) => editor.document.uri.toString() === this.documentUri);
    }
    currentViewColumn() {
        let editor = this.findEditor();
        if (editor)
            return editor.viewColumn;
        else
            return vscode.window.activeTextEditor.viewColumn;
    }
    onCoqReset() {
        this.reset();
        this.statusBar.setStateReady();
    }
    /** Bring the focus into the editor's view, but only scroll rightward
     * if the focus is not at the end of a line
     * */
    setCursorToFocus(editor, scroll = true, scrollHorizontal = false) {
        if (!editor)
            return;
        editor.selections = [new vscode.Selection(this.focus, this.focus)];
        if (scroll) {
            if (scrollHorizontal || textUtil.positionIsBefore(this.focus, this.document.lineAt(this.focus.line).range.end))
                editor.revealRange(new vscode.Range(this.focus, this.focus), vscode.TextEditorRevealType.Default);
            else
                editor.revealRange(new vscode.Range(this.focus.line, 0, this.focus.line + 1, 0), vscode.TextEditorRevealType.Default);
        }
    }
    updateFocus(focus, moveCursor = false) {
        if (focus) {
            this.focus = new vscode.Position(focus.line, focus.character);
            if (moveCursor) {
                // adjust the cursor position
                for (let editor of this.cursorUnmovedSinceCommandInitiated)
                    this.setCursorToFocus(editor, editor === vscode.window.activeTextEditor);
            }
            // update the focus decoration
            const focusRange = new vscode.Range(this.focus.line, 0, this.focus.line, 1);
            if (this.focus.line === 0 && focus.character === 0) {
                for (let editor of this.allEditors()) {
                    editor.setDecorations(Decorations_1.decorations.focusBefore, [focusRange]);
                    editor.setDecorations(Decorations_1.decorations.focus, []);
                }
            }
            else {
                for (let editor of this.allEditors()) {
                    editor.setDecorations(Decorations_1.decorations.focusBefore, []);
                    editor.setDecorations(Decorations_1.decorations.focus, [focusRange]);
                }
            }
        }
        else {
            for (let editor of this.allEditors())
                editor.setDecorations(Decorations_1.decorations.focus, []);
        }
    }
    userSetCoqtopPath(global = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const current = vscode.workspace.getConfiguration("coqtop").get("binPath", "");
            const newPath = yield vscode.window.showInputBox({ ignoreFocusOut: true, value: current, validateInput: v => {
                    try {
                        const statDir = fs.statSync(v);
                        if (!statDir.isDirectory())
                            return "not a directory";
                    }
                    catch (err) {
                        return "invalid path";
                    }
                    let stat = undefined;
                    try {
                        stat = fs.statSync(path.join(v, 'coqtop'));
                    }
                    catch (err) { }
                    if (!stat && os.platform() === 'win32') {
                        try {
                            stat = fs.statSync(path.join(v, 'coqtop.exe'));
                        }
                        catch (err) { }
                    }
                    if (!stat)
                        return "coqtop not found here";
                    if (!stat.isFile())
                        return "coqtop found here, but is not an executable file";
                    return null;
                } });
            function checkCoqtopExists(newPath) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!newPath)
                        return false;
                    try {
                        return (yield fs.existsSync(path.join(newPath, 'coqtop'))) || (yield fs.existsSync(path.join(newPath, 'coqtop.exe')));
                    }
                    catch (err) {
                        return false;
                    }
                });
            }
            if (yield checkCoqtopExists(newPath))
                yield vscode.workspace.getConfiguration("coqtop").update("binPath", newPath, global);
        });
    }
    handleResult(value) {
        if (value.type === 'busy')
            return false;
        if (value.type === 'not-running') {
            this.updateFocus(undefined, false);
            if (value.reason === 'spawn-failed') {
                const getCoq = { title: "Get Coq", id: 0 };
                const setPathLocal = { title: "Set path for this project", id: 1 };
                const setPathGlobal = { title: "Set path globally", id: 2 };
                vscode.window.showErrorMessage(`Could not start coqtop ${value.coqtop ? ` (${value.coqtop})` : ""}`, getCoq, setPathLocal, setPathGlobal)
                    .then((act) => __awaiter(this, void 0, void 0, function* () {
                    if (act && act.id === getCoq.id) {
                        vscode.commands.executeCommand("vscode.open", vscode.Uri.parse('https://coq.inria.fr/download'));
                    }
                    else if (act && (act.id === setPathLocal.id || act.id === setPathGlobal.id)) {
                        yield this.userSetCoqtopPath(act.id === setPathGlobal.id);
                    }
                }));
            }
        }
        else
            this.updateFocus(value.focus, this.project.settings.moveCursorToFocus);
        if (value.type === 'interrupted')
            this.statusBar.setStateComputing(proto.ComputingStatus.Interrupted);
        return true;
    }
    stepForward(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Stepping forward');
            try {
                this.rememberCursors();
                const value = yield this.langServer.stepForward();
                this.view.update(value);
                this.handleResult(value);
            }
            catch (err) {
            }
            this.statusBar.setStateReady();
        });
    }
    stepBackward(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Stepping backward');
            try {
                this.rememberCursors();
                const value = yield this.langServer.stepBackward();
                this.view.update(value);
                if (this.handleResult(value))
                    this.statusBar.setStateReady();
            }
            catch (err) {
            }
        });
    }
    finishComputations(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Finishing computations');
            try {
                const value = yield this.langServer.finishComputations();
                this.statusBar.setStateReady();
            }
            catch (err) {
            }
        });
    }
    interpretToCursorPosition(editor, synchronous = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Interpretting to point');
            try {
                if (!editor || editor.document.uri.toString() !== this.documentUri)
                    return;
                const value = yield this.langServer.interpretToPoint(editor.selection.active, synchronous);
                this.view.update(value);
                this.handleResult(value);
            }
            catch (err) {
                console.warn("Interpret to point failed: " + err.toString());
                if (err.stack)
                    console.log("Stack: \n" + err.stack);
            }
            this.statusBar.setStateReady();
        });
    }
    interpretToEnd(editor, synchronous = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Interpreting to end');
            try {
                const params = { uri: this.documentUri };
                const value = yield this.langServer.interpretToEnd(synchronous);
                this.view.update(value);
                this.handleResult(value);
            }
            catch (err) { }
            this.statusBar.setStateReady();
        });
    }
    check(query) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Running query');
            try {
                const results = yield this.langServer.check(query);
                this.displayQueryResults(results);
            }
            catch (err) {
            }
            finally {
                this.statusBar.setStateReady();
            }
        });
    }
    print(query) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Running query');
            try {
                const results = yield this.langServer.print(query);
                this.displayQueryResults(results);
            }
            catch (err) {
            }
            finally {
                this.statusBar.setStateReady();
            }
        });
    }
    displayQueryResults(results) {
        this.queryOut.clear();
        this.queryOut.show(true);
        this.queryOut.append(text.textToDisplayString(results.searchResults));
    }
    locate(query) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Running query');
            try {
                const results = yield this.langServer.locate(query);
                this.displayQueryResults(results);
            }
            catch (err) {
            }
            finally {
                this.statusBar.setStateReady();
            }
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Running query');
            try {
                const results = yield this.langServer.search(query);
                this.displayQueryResults(results);
            }
            catch (err) {
            }
            finally {
                this.statusBar.setStateReady();
            }
        });
    }
    searchAbout(query) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Running query');
            try {
                const results = yield this.langServer.searchAbout(query);
                this.displayQueryResults(results);
            }
            catch (err) {
            }
            finally {
                this.statusBar.setStateReady();
            }
        });
    }
    viewGoalState(editor, external) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (external) {
                    yield this.view.showExternal(this.project.settings.externalViewScheme, (url) => {
                        const command = this.project.settings.externalViewUrlCommand.replace(/\$\{url\}/g, url);
                        const parts = require('string-argv')(command);
                        return { module: parts[0], args: parts.slice(1) };
                    });
                }
                else
                    yield this.view.show(true, CoqView_1.adjacentPane(editor.viewColumn));
            }
            catch (err) { }
        });
    }
    ltacProfGetResults(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.setStateWorking('Running query');
            try {
                if (!editor || editor.document.uri.toString() !== this.documentUri)
                    return;
                const offset = editor.document.offsetAt(editor.selection.active);
                this.currentLtacProfView = new HtmlLtacProf_1.HtmlLtacProf({ total_time: 0, tactics: [] });
                this.currentLtacProfView.show(true);
                yield this.langServer.ltacProfGetResults(offset);
            }
            catch (err) {
            }
            finally {
                this.statusBar.setStateReady();
            }
        });
    }
    onLtacProfResults(results) {
        if (!this.currentLtacProfView)
            this.currentLtacProfView = new HtmlLtacProf_1.HtmlLtacProf(results);
        else
            this.currentLtacProfView.update(results);
    }
    doOnLostFocus() {
        return __awaiter(this, void 0, void 0, function* () {
            this.statusBar.unfocus();
        });
    }
    doOnFocus(editor) {
        return __awaiter(this, void 0, void 0, function* () {
            this.highlights.refresh([editor]);
            this.statusBar.focus();
            // await this.view.show(true);
        });
    }
    doOnSwitchActiveEditor(oldEditor, newEditor) {
        return __awaiter(this, void 0, void 0, function* () {
            this.highlights.refresh([newEditor]);
        });
    }
    queryDisplayOptionChange() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield vscode.window.showQuickPick(DisplayOptionPicks.allPicks);
            return result.displayItem;
        });
    }
    setDisplayOption(item, value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!item && !value) {
                item = yield this.queryDisplayOptionChange();
                if (!item)
                    return;
                value = proto.SetDisplayOption.Toggle;
            }
            try {
                yield this.langServer.setDisplayOptions([{ item: item, value: value }]);
                const proofview = yield this.langServer.getGoal();
                this.view.update(proofview);
            }
            catch (err) { }
        });
    }
    viewGoalAt(editor, pos) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!pos)
                    pos = editor.selection.active;
                const proofview = yield this.langServer.getCachedGoal(pos);
                if (proofview.type === "proof-view")
                    this.view.update(proofview);
            }
            catch (err) { }
        });
    }
}
exports.CoqDocument = CoqDocument;
//# sourceMappingURL=CoqDocument.js.map