'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const path = require('path');
const vscode = require('vscode');
const proto = require('./protocol');
const vscode_1 = require('vscode');
const vscode_languageclient_1 = require('vscode-languageclient');
function createServerProcess(serverModule, debugOptions) {
    let nodejsPath = vscode_1.workspace.getConfiguration('nodejs')['path'] || '';
    let nodejsCmd = path.join(nodejsPath, 'node');
    // If the extension is launch in debug mode the debug server options are use
    // Otherwise the run options are used
    var args = debugOptions.concat([serverModule]);
    return {
        run: { command: nodejsCmd, args: [serverModule] },
        debug: { command: nodejsCmd, args: debugOptions.concat([serverModule]) }
    };
}
function createServerLocalExtension(serverModule, debugOptions) {
    const options = {
        run: { module: serverModule },
        debug: { module: serverModule, options: { execArgv: debugOptions } }
    };
    return options;
}
class CoqLanguageServer {
    constructor(context) {
        this.subscriptions = [];
        this.server = null;
        this.cancelRequest = new vscode.CancellationTokenSource();
        this.onUpdateHighlightsHandlers = new Set();
        this.onMessageHandlers = new Set();
        this.onResetHandlers = new Set();
        this.onUpdateCoqStmFocusHandlers = new Set();
        this.onLtacProfResultsHandlers = new Set();
        // The server is implemented in node
        let serverModule = context.asAbsolutePath(path.join('server/src', 'server.js'));
        // The debug options for the server
        let debugOptions = ["--nolazy", "--debug=6005"];
        // let serverOptions = createServerProcess(serverModule, debugOptions);
        let serverOptions = createServerLocalExtension(serverModule, debugOptions);
        // Options to control the language client
        let clientOptions = {
            // Register the server for Coq scripts
            documentSelector: ['coq'],
            synchronize: {
                // Synchronize the setting section 'languageServerExample' to the server
                configurationSection: ['coqtop', 'coq', 'prettifySymbolsMode'],
                // Notify the server about file changes to '.clientrc files contain in the workspace
                fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
            }
        };
        /** TODO: remove this once vscode-languageclient 3.0.0alpha.3 comes out, fixing #106 */
        function startedInDebugMode() {
            let args = process.execArgv;
            if (args) {
                return args.some((arg) => /^--debug=?/.test(arg) || /^--debug-brk=?/.test(arg));
            }
            ;
            return false;
        }
        // Create the language client and start the client.
        this.server = new vscode_languageclient_1.LanguageClient('Coq Language Server', serverOptions, clientOptions, startedInDebugMode());
        this.server.onReady()
            .then(() => {
            this.server.onNotification(proto.UpdateHighlightsNotification.type, (p) => this.onUpdateHighlightsHandlers.forEach((h) => h(p)));
            this.server.onNotification(proto.CoqMessageNotification.type, (p) => this.onMessageHandlers.forEach((h) => h(p)));
            this.server.onNotification(proto.CoqResetNotification.type, (p) => this.onResetHandlers.forEach((h) => h(p)));
            this.server.onNotification(proto.CoqStmFocusNotification.type, (p) => this.onUpdateCoqStmFocusHandlers.forEach((h) => h(p)));
            this.server.onNotification(proto.CoqLtacProfResultsNotification.type, (p) => this.onLtacProfResultsHandlers.forEach((h) => h(p)));
            console.log("Coq language server ready");
        })
            .catch((reason) => console.log("Coq language server failed to load: " + reason.toString()));
        this.subscriptions.push(this.server.start());
    }
    static create(context) {
        if (!CoqLanguageServer.instance)
            CoqLanguageServer.instance = new CoqLanguageServer(context);
        return CoqLanguageServer.instance;
    }
    static getInstance() {
        return this.instance;
    }
    dispose() {
        this.server.stop();
        this.subscriptions.forEach((d) => d.dispose());
        this.cancelRequest.dispose();
        this.subscriptions = [];
    }
    onUpdateHighlights(listener) {
        this.onUpdateHighlightsHandlers.add(listener);
        return { dispose: () => this.onUpdateHighlightsHandlers.delete(listener) };
    }
    onMessage(listener) {
        this.onMessageHandlers.add(listener);
        return { dispose: () => this.onMessageHandlers.delete(listener) };
    }
    onReset(listener) {
        this.onResetHandlers.add(listener);
        return { dispose: () => this.onResetHandlers.delete(listener) };
    }
    onUpdateCoqStmFocus(listener) {
        this.onUpdateCoqStmFocusHandlers.add(listener);
        return { dispose: () => this.onUpdateCoqStmFocusHandlers.delete(listener) };
    }
    onLtacProfResults(listener) {
        this.onLtacProfResultsHandlers.add(listener);
        return { dispose: () => this.onLtacProfResultsHandlers.delete(listener) };
    }
    interruptCoq(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            this.cancelRequest.dispose();
            this.cancelRequest = new vscode.CancellationTokenSource();
            yield this.server.sendRequest(proto.InterruptCoqRequest.type, { uri: uri }, this.cancelRequest.token);
        });
    }
    quitCoq(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return yield this.server.sendRequest(proto.QuitCoqRequest.type, { uri: uri });
        });
    }
    resetCoq(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return yield this.server.sendRequest(proto.ResetCoqRequest.type, { uri: uri });
        });
    }
    getGoal(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return yield this.server.sendRequest(proto.GoalRequest.type, { uri: uri }, this.cancelRequest.token);
        });
    }
    getCachedGoal(uri, pos) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return yield this.server.sendRequest(proto.CachedGoalRequest.type, { uri: uri, position: pos }, this.cancelRequest.token);
        });
    }
    finishComputations(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return yield this.server.sendRequest(proto.FinishComputationsRequest.type, { uri: uri }, this.cancelRequest.token);
        });
    }
    stepForward(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.StepForwardRequest.type, { uri: uri }, this.cancelRequest.token);
        });
    }
    stepBackward(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.StepBackwardRequest.type, { uri: uri }, this.cancelRequest.token);
        });
    }
    interpretToPoint(uri, location, synchronous) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            const params = {
                uri: uri,
                location: location,
                synchronous: synchronous,
            };
            return this.server.sendRequest(proto.InterpretToPointRequest.type, params, this.cancelRequest.token);
        });
    }
    interpretToEnd(uri, synchronous) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.InterpretToEndRequest.type, { uri: uri, synchronous: synchronous }, this.cancelRequest.token);
        });
    }
    resizeView(uri, columns) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.ResizeWindowRequest.type, { uri: uri, columns: columns }, this.cancelRequest.token);
        });
    }
    ltacProfGetResults(uri, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.LtacProfResultsRequest.type, { uri: uri, offset: offset }, this.cancelRequest.token);
        });
    }
    getPrefixText(uri, pos, token) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.GetSentencePrefixTextRequest.type, { uri: uri, position: pos }, token || this.cancelRequest.token);
        });
    }
    locate(uri, query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.QueryRequest.type, {
                uri: uri,
                queryFunction: proto.QueryFunction.Locate,
                query: query
            }, this.cancelRequest.token);
        });
    }
    check(uri, query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.QueryRequest.type, {
                uri: uri,
                queryFunction: proto.QueryFunction.Check,
                query: query
            }, this.cancelRequest.token);
        });
    }
    print(uri, query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.QueryRequest.type, {
                uri: uri,
                queryFunction: proto.QueryFunction.Print,
                query: query
            }, this.cancelRequest.token);
        });
    }
    search(uri, query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.QueryRequest.type, {
                uri: uri,
                queryFunction: proto.QueryFunction.Search,
                query: query
            }, this.cancelRequest.token);
        });
    }
    searchAbout(uri, query) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.QueryRequest.type, {
                uri: uri,
                queryFunction: proto.QueryFunction.SearchAbout,
                query: query
            }, this.cancelRequest.token);
        });
    }
    setDisplayOptions(uri, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.onReady();
            return this.server.sendRequest(proto.SetDisplayOptionsRequest.type, {
                uri: uri,
                options: options
            }, this.cancelRequest.token);
        });
    }
}
CoqLanguageServer.instance = null;
exports.CoqLanguageServer = CoqLanguageServer;
class CoqDocumentLanguageServer {
    constructor(uri) {
        this.uri = uri;
        this.server = CoqLanguageServer.getInstance();
        this.subscriptions = [];
    }
    dispose() {
        this.subscriptions.forEach((d) => d.dispose());
    }
    onUpdateHighlights(listener) {
        this.subscriptions.push(this.server.onUpdateHighlights((p) => {
            if (p.uri === this.uri)
                listener(p);
        }));
    }
    onMessage(listener) {
        this.subscriptions.push(this.server.onMessage((p) => {
            if (p.uri === this.uri)
                listener(p);
        }));
    }
    onReset(listener) {
        this.subscriptions.push(this.server.onReset((p) => {
            if (p.uri === this.uri)
                listener(p);
        }));
    }
    onUpdateCoqStmFocus(listener) {
        this.subscriptions.push(this.server.onUpdateCoqStmFocus((p) => {
            if (p.uri === this.uri)
                listener(p);
        }));
    }
    onLtacProfResults(listener) {
        this.subscriptions.push(this.server.onLtacProfResults((p) => {
            if (p.uri === this.uri)
                listener(p.results);
        }));
    }
    interruptCoq() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.server.interruptCoq(this.uri);
        });
    }
    quitCoq() {
        return this.server.quitCoq(this.uri);
    }
    resetCoq() {
        return this.server.resetCoq(this.uri);
    }
    getGoal() {
        return this.server.getGoal(this.uri);
    }
    getCachedGoal(pos) {
        return this.server.getCachedGoal(this.uri, pos);
    }
    finishComputations() {
        return this.server.finishComputations(this.uri);
    }
    stepForward() {
        return this.server.stepForward(this.uri);
    }
    stepBackward() {
        return this.server.stepBackward(this.uri);
    }
    interpretToPoint(offset, synchronous) {
        return this.server.interpretToPoint(this.uri, offset, synchronous);
    }
    interpretToEnd(synchronous) {
        return this.server.interpretToEnd(this.uri, synchronous);
    }
    resizeView(columns) {
        return this.server.resizeView(this.uri, columns);
    }
    ltacProfGetResults(offset) {
        return this.server.ltacProfGetResults(this.uri, offset);
    }
    locate(query) {
        return this.server.locate(this.uri, query);
    }
    check(query) {
        return this.server.check(this.uri, query);
    }
    print(query) {
        return this.server.print(this.uri, query);
    }
    search(query) {
        return this.server.search(this.uri, query);
    }
    searchAbout(query) {
        return this.server.searchAbout(this.uri, query);
    }
    setDisplayOptions(options) {
        return this.server.setDisplayOptions(this.uri, options);
    }
}
exports.CoqDocumentLanguageServer = CoqDocumentLanguageServer;
//# sourceMappingURL=CoqLanguageServer.js.map