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
const fs = require('fs');
const extension_1 = require('./extension');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const docs = require('./CoqProject');
const nasync = require('./nodejs-async');
const webServer = require('./WebServer');
const opener = require('opener');
function createFile(path) {
    return new Promise((resolve, reject) => {
        fs.open(path, 'w', (err, fd) => {
            if (err)
                reject(err);
            else
                resolve(fd);
        });
    });
}
function writeFile(filename, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filename, data, { encoding: 'utf8' }, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
const VIEW_PATH = 'html_views';
function proofViewCSSFile() {
    const userDir = vscode.workspace.getConfiguration("coq.hacks")
        .get("userSettingsLocation", null)
        || extension_1.extensionContext.asAbsolutePath(path.join(VIEW_PATH, 'goals'));
    return vscode.Uri.file(path.join(userDir, 'proof-view.css'));
}
function proofViewFile(file = "") {
    return vscode.Uri.file(extension_1.extensionContext.asAbsolutePath(path.join(VIEW_PATH, 'goals', file)));
}
function proofViewHtmlPath() {
    return proofViewFile('Coq.html');
}
function edit(editor) {
    return new Promise((resolve, reject) => editor.edit(resolve));
}
function coqViewToFileUri(uri) {
    return `file://${uri.path}?${uri.query}#${uri.fragment}`;
}
class IFrameDocumentProvider {
    constructor() {
        this.onDidChangeEmitter = new vscode.EventEmitter();
    }
    provideTextDocumentContent(uri) {
        return `<!DOCTYPE HTML><body style="margin:0px;padding:0px;width:100%;height:100vh;border:none;position:absolute;top:0px;left:0px;right:0px;bottom:0px">
<iframe src="${coqViewToFileUri(uri)}" seamless style="position:absolute;top:0px;left:0px;right:0px;bottom:0px;border:none;margin:0px;padding:0px;width:100%;height:100%" />
</body>`;
    }
    get onDidChange() {
        return this.onDidChangeEmitter.event;
    }
}
var coqViewProvider = null;
/**
 * Displays a Markdown-HTML file which contains javascript to connect to this view
 * and update the goals and show other status info
 */
class HtmlCoqView {
    constructor(uri, context) {
        this.currentState = { type: 'not-running', reason: 'not-started' };
        this.onresize = null;
        this.currentSettings = {};
        if (coqViewProvider === null) {
            coqViewProvider = new IFrameDocumentProvider();
            var registration = vscode.workspace.registerTextDocumentContentProvider('coq-view', coqViewProvider);
            context.subscriptions.push(registration);
            context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => this.updateSettings()));
        }
        this.docUri = uri;
        const httpServer = this.httpServer = http.createServer();
        this.serverReady = new Promise((resolve, reject) => httpServer.listen(0, 'localhost', undefined, (e) => {
            if (e)
                reject(e);
            else
                resolve();
        }));
        this.server = new WebSocket.Server({ server: httpServer });
        this.server.on('connection', (ws) => {
            ws.onmessage = (event) => this.handleClientMessage(event);
            this.updateSettings([ws]);
            this.sendMessage({ command: 'goal-update', goal: this.currentState }, [ws]);
        });
    }
    handleClientResize(event) {
        if (this.onresize)
            this.onresize(event.columns);
    }
    handleClientMessage(event) {
        const message = JSON.parse(event.data);
        switch (message.eventName) {
            case 'resize':
                this.handleClientResize(message.params);
                return;
            case 'focus':
                docs.getProject().setActiveDoc(this.docUri);
                return;
        }
    }
    createBuffer() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.serverReady;
                const serverAddress = this.httpServer.address();
                yield HtmlCoqView.prepareStyleSheet();
                this.coqViewUri = vscode.Uri.parse(`coq-view://${proofViewHtmlPath().path.replace(/%3A/, ':')}?host=${serverAddress.address}&port=${serverAddress.port}`);
                console.log("Goals: " + decodeURIComponent(this.coqViewUri.with({ scheme: 'file' }).toString()));
            }
            catch (err) {
                vscode.window.showErrorMessage(err.toString());
            }
        });
    }
    getUri() {
        return this.coqViewUri;
    }
    show(preserveFocus, pane) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.coqViewUri)
                yield this.createBuffer();
            // const focusedDoc = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
            yield vscode.commands.executeCommand('vscode.previewHtml', this.coqViewUri, pane, "ProofView: " + path.basename(this.docUri.fsPath));
            // if(preserveFocus && focusedDoc)
            //   await vscode.window.showTextDocument(focusedDoc);
        });
    }
    showExternal(scheme, command) {
        return __awaiter(this, void 0, void 0, function* () {
            let url;
            if (scheme === "file") {
                url = decodeURIComponent(coqViewToFileUri(this.coqViewUri).toString());
            }
            else {
                // this.coqViewUri = vscode.Uri.parse(`coq-view://${proofViewHtmlPath().path.replace(/%3A/, ':')}?host=${serverAddress.address}&port=${serverAddress.port}`);
                const uri = yield webServer.serveDirectory("proof-view/", proofViewFile('..').fsPath, "**/*.{html,css,js}");
                url = decodeURIComponent(uri.with({ path: uri.path + 'goals/Coq.html', query: this.coqViewUri.query, fragment: this.coqViewUri.fragment }).toString());
            }
            if (!command)
                return Promise.resolve(opener(url));
            else {
                const c = command(url);
                return Promise.resolve(opener(c.args.join(' '), { command: c.module }));
            }
        });
    }
    dispose() {
        // this.editor.hide();
    }
    sendMessage(message, clients = this.server.clients) {
        for (const connection of clients) {
            try {
                connection.send(JSON.stringify(message));
            }
            catch (error) { }
        }
    }
    update(state, clients = this.server.clients) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentState = state;
            this.sendMessage({ command: 'goal-update', goal: state }, clients);
        });
    }
    updateSettings(clients = this.server.clients) {
        this.currentSettings.fontFamily = vscode.workspace.getConfiguration("editor").get("fontFamily");
        this.currentSettings.fontSize = `${vscode.workspace.getConfiguration("editor").get("fontSize")}px`;
        this.currentSettings.fontWeight = vscode.workspace.getConfiguration("editor").get("fontWeight");
        this.currentSettings.cssFile = decodeURIComponent(proofViewCSSFile().toString());
        this.sendMessage(Object.assign(this.currentSettings, { command: 'settings-update' }), clients);
    }
    static shouldResetStyleSheet() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const styleFile = proofViewCSSFile();
                if (!(yield nasync.fs.exists(styleFile.fsPath)))
                    return true;
                const stat = yield nasync.fs.stat(styleFile.fsPath);
                if (stat.size < 5 && (yield nasync.fs.readFile(styleFile.fsPath, 'utf8')).trim() === "")
                    return true;
            }
            catch (err) {
                console.error(err.toString());
            }
            return false;
        });
    }
    /** makes sure that the style sheet is available */
    static prepareStyleSheet() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const styleFile = proofViewCSSFile();
                if ((yield HtmlCoqView.shouldResetStyleSheet()) === true) {
                    const defaultFile = proofViewFile('default-proof-view.css');
                    yield nasync.fs.copyFile(defaultFile.fsPath, styleFile.fsPath);
                }
            }
            catch (err) {
                console.error(err.toString());
            }
        });
    }
    static customizeProofViewStyle() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield HtmlCoqView.prepareStyleSheet();
                const styleFile = proofViewCSSFile();
                const doc = yield vscode.workspace.openTextDocument(styleFile.fsPath);
                const ed = yield vscode.window.showTextDocument(doc);
            }
            catch (err) {
                console.error(err.toString());
            }
        });
    }
}
exports.HtmlCoqView = HtmlCoqView;
//# sourceMappingURL=HtmlCoqView.js.map