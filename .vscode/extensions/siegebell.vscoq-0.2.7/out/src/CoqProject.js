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
const CoqDocument_1 = require('./CoqDocument');
var CoqDocument_2 = require('./CoqDocument');
exports.CoqDocument = CoqDocument_2.CoqDocument;
const CoqLanguageServer_1 = require('./CoqLanguageServer');
const editorAssist = require('./EditorAssist');
function getProject() {
    if (!CoqProject.getInstance())
        throw "CoqProject not yet loaded";
    return CoqProject.getInstance();
}
exports.getProject = getProject;
class CoqProject {
    constructor(context) {
        this.documents = new Map();
        this.activeEditor = null;
        /** the coq-doc that is either active, was the last to be active, or is associated with a helper view (proof-view) */
        this.activeDoc = null;
        this.subscriptions = [];
        this.langServer = CoqLanguageServer_1.CoqLanguageServer.create(context);
        this.activeEditor = vscode.window.activeTextEditor;
        vscode.workspace.onDidChangeTextDocument((params) => this.onDidChangeTextDocument(params));
        vscode.workspace.onDidOpenTextDocument((params) => this.onDidOpenTextDocument(params));
        vscode.workspace.onDidCloseTextDocument((params) => this.onDidCloseTextDocument(params));
        vscode.window.onDidChangeActiveTextEditor((params) => this.onDidChangeActiveTextEditor(params));
        // Handle already-loaded documents
        vscode.workspace.textDocuments
            .forEach((textDoc) => this.tryLoadDocument(textDoc));
        this.currentSettings = vscode.workspace.getConfiguration("coq");
        this.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
            editorAssist.reload();
            this.currentSettings = vscode.workspace.getConfiguration("coq");
            if (this.currentSettings.moveCursorToFocus === undefined)
                this.currentSettings.moveCursorToFocus = true;
        }));
    }
    static create(context) {
        if (!CoqProject.instance)
            CoqProject.instance = new CoqProject(context);
        return CoqProject.instance;
    }
    static getInstance() {
        return CoqProject.instance;
    }
    dispose() {
        this.documents.forEach((doc) => doc.dispose());
        this.subscriptions.forEach((s) => s.dispose());
        this.langServer.dispose();
        this.langServer = null;
        this.subscriptions = [];
        this.documents.clear();
    }
    get(uri) {
        return this.documents.get(uri);
    }
    getOrCurrent(uri) {
        return this.documents.get(uri) || this.activeDoc;
    }
    getLanguageServer() {
        return this.langServer;
    }
    get settings() {
        return this.currentSettings;
    }
    tryLoadDocument(textDoc) {
        if (textDoc.languageId !== 'coq')
            return;
        const uri = textDoc.uri.toString();
        if (!this.documents.has(uri)) {
            this.documents.set(uri, new CoqDocument_1.CoqDocument(textDoc, this));
        }
        // refresh this in case the loaded document has focus and it was not in our registry
        if (this.documents.has(vscode.window.activeTextEditor.document.uri.toString()))
            this.activeDoc = this.documents.get(vscode.window.activeTextEditor.document.uri.toString());
    }
    onDidChangeTextDocument(params) {
        const uri = params.document.uri.toString();
        const editor = vscode.window.visibleTextEditors.find((editor, i, a) => editor.document.uri.toString() === uri);
        const doc = this.documents.get(uri);
        if (!doc)
            return;
        doc.onDidChangeTextDocument(params);
        // FOR DEBUGGING ONLY!!!
        // doc.highlights.refresh(doc.allEditors());
    }
    onDidOpenTextDocument(doc) {
        this.tryLoadDocument(doc);
    }
    onDidCloseTextDocument(doc) {
        const uri = doc.uri.toString();
        const coqDoc = this.documents.get(uri);
        this.documents.delete(uri);
        if (!coqDoc)
            return;
        coqDoc.dispose();
    }
    getActiveDoc() {
        return this.activeDoc;
    }
    setActiveDoc(doc) {
        this.activeDoc = this.documents.get(doc.toString());
    }
    onDidChangeActiveTextEditor(editor) {
        let oldUri;
        try {
            oldUri = this.activeEditor.document.uri.toString();
        }
        catch (err) {
            oldUri = null;
        }
        const oldDoc = oldUri ? this.documents.get(oldUri) : null;
        if (!editor) {
            if (oldDoc)
                oldDoc.doOnLostFocus();
            return;
        }
        // newly active editor
        const uri = editor.document ? editor.document.uri.toString() : null;
        const doc = this.documents.get(uri) || this.tryLoadDocument(editor.document);
        if (doc)
            this.activeDoc = doc;
        if (doc && oldDoc && uri == oldUri)
            doc.doOnSwitchActiveEditor(this.activeEditor, editor);
        else {
            if (doc)
                doc.doOnFocus(editor);
            if (oldDoc)
                oldDoc.doOnLostFocus();
        }
        this.activeEditor = editor;
    }
    tryDocumentCommand(command, useActive = true, makeVisible = true, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            let editor = vscode.window.activeTextEditor;
            let doc;
            try {
                doc = this.documents.get(editor ? editor.document.uri.toString() : null);
            }
            catch (err) { }
            if (!doc && useActive) {
                doc = this.activeDoc;
                editor = this.activeEditor;
            }
            if (doc) {
                if (makeVisible && !vscode.window.visibleTextEditors.some((d) => d.document === doc.getDocument()))
                    yield vscode.window.showTextDocument(doc.getDocument(), undefined, true);
                yield command.call(doc, editor, ...args);
            }
        });
    }
    quitCoq() {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.quitCoq, false, false);
    }
    resetCoq() {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.resetCoq, false, false);
    }
    stepForward() {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.stepForward);
    }
    stepBackward() {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.stepBackward);
    }
    interpretToPoint(options = {}) {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.interpretToCursorPosition, false, false, options.synchronous);
    }
    interpretToEnd(options = {}) {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.interpretToEnd, false, false, options.synchronous);
    }
    interruptCoq() {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.interruptCoq);
    }
    finishComputations() {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.finishComputations);
    }
    ltacProfGetResults() {
        return this.tryDocumentCommand(CoqDocument_1.CoqDocument.prototype.ltacProfGetResults);
    }
    setCursorToFocus() {
        function helper(editor) {
            return Promise.resolve(this.setCursorToFocus(editor, true, true));
        }
        return this.tryDocumentCommand(helper, false, false);
    }
    setDisplayOption(item, value) {
        function setDisplayOption(editor) {
            return Promise.resolve(this.setDisplayOption(item, value));
        }
        return this.tryDocumentCommand(setDisplayOption, true, false);
    }
}
CoqProject.instance = null;
exports.CoqProject = CoqProject;
//# sourceMappingURL=CoqProject.js.map