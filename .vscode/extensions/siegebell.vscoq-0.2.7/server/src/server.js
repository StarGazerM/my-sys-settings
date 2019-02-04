'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode_languageserver_1 = require('vscode-languageserver');
const coqproto = require('./protocol');
const CoqProject_1 = require('./CoqProject');
// Create a connection for the server. The connection uses 
// stdin / stdout for message passing
exports.connection = vscode_languageserver_1.createConnection(process.stdin, process.stdout);
exports.project = null;
// // Create a simple text document manager. The text document manager
// // supports full document sync only
// let documents: TextDocuments = new TextDocuments();
// // Make the text document manager listen on the connection
// // for open, change and close text document events
// documents.listen(connection);
// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
let workspaceRoot;
exports.connection.onInitialize((params) => {
    console.log = (e) => { exports.connection.console.log(">>> " + e); };
    console.info = (e) => { exports.connection.console.info(">>> " + e); };
    console.warn = (e) => { exports.connection.console.warn(">>> " + e); };
    console.error = (e) => { exports.connection.console.error(">>> " + e); };
    exports.connection.console.log(`Coq Language Server: process.version: ${process.version}, process.arch: ${process.arch}}`);
    // connection.console.log(`execArgv: ${process.execArgv.join(' ')}`);
    // connection.console.log(`argv: ${process.argv.join(' ')}`);
    // connection.console.log('coq path: ' + currentSettings.coqPath);
    workspaceRoot = params.rootPath;
    // let x: vscodeLangServer.RemoteConsole = {
    //   log: (x) => {},
    //   error: (x) => {},
    //   warn: (x) => {},
    //   info: (x) => {}
    // }
    // project = new CoqProject(params.rootPath, x);
    exports.project = new CoqProject_1.CoqProject(params.rootPath, exports.connection);
    // var x : ServerCapabilities;
    return {
        capabilities: {
            textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Incremental,
            // Tell the client that the server support code complete
            completionProvider: {
                resolveProvider: true
            },
            documentLinkProvider: {
                resolveProvider: true
            },
            documentSymbolProvider: true,
            definitionProvider: true,
        }
    };
});
exports.connection.onShutdown(() => {
    exports.project.shutdown();
});
// documents.onDidChangeContent((change) => {
//   var uri = change.document.uri;
// });
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
// documents.onDidChangeContent((change) => {
//   var uri = change.document.uri;
//   if (typeof coqInstances[uri] === "undefined") {
//   	connection.console.log(`${uri} opened.`);
//     coqInstances[uri] = new CoqDocument(coqPath, change.document, connection.console, {
//       sendHighlightUpdates: (h) => sendHighlightUpdates(uri, h),
//       sendDiagnostics: (diagnostics) => sendDiagnostics(uri, diagnostics)
//       });
//   }
//   else {
//   }
// });
// The settings have changed. Is send on server activation
// as well.
exports.connection.onDidChangeConfiguration((change) => {
    let settings = change.settings;
    exports.project.updateSettings(settings);
    exports.connection.console.log('Changed path to: ' + exports.project.settings.coqtop.binPath);
    // Revalidate any open text documents
    //documents.all().forEach(validateTextDocument);
});
// connection.onDidChangeWatchedFiles((change) => {
// 	// Monitored files have change in VSCode
// 	connection.console.log('We received a file change event');
// });
process.on('SIGBREAK', function () {
    exports.connection.console.log('SIGBREAK fired');
});
// This handler provides the initial list of the completion items.
exports.connection.onCompletion((textDocumentPosition) => {
    // The pass parameter contains the position of the text document in 
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [];
    // 	{
    // 		label: 'idtac',
    // 		kind: CompletionItemKind.Snippet,
    // 		data: 1
    // 	},
    // 	{
    // 		label: 'Definition',
    // 		kind: CompletionItemKind.Keyword,
    // 		data: 2
    // 	},
    // 	{
    // 		label: 'reflexivity.',
    // 		kind: CompletionItemKind.Text,
    // 		data: 4
    // 	}
    // ]
});
// This handler resolve additional information for the item selected in
// the completion list.
exports.connection.onCompletionResolve((item) => {
    if (item.data === 1) {
        item.detail = 'Tactic';
    }
    else if (item.data === 4) {
        item.detail = 'JavaScript details',
            item.documentation = 'solves by reflexivity';
    }
    return item;
});
// export interface RequestHandler<P, R, E> {
//     (params: P, token: CancellationToken): R | ResponseError<E> | Thenable<R | ResponseError<E>>;
// }
exports.connection.onRequest(coqproto.InterruptCoqRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .interrupt();
});
exports.connection.onRequest(coqproto.QuitCoqRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .quitCoq();
});
exports.connection.onRequest(coqproto.ResetCoqRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .resetCoq();
});
exports.connection.onRequest(coqproto.StepForwardRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .stepForward(token);
});
exports.connection.onRequest(coqproto.StepBackwardRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .stepBackward(token);
});
exports.connection.onRequest(coqproto.InterpretToPointRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .interpretToPoint(params.location, params.synchronous, token);
});
exports.connection.onRequest(coqproto.InterpretToEndRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .interpretToEnd(params.synchronous, token);
});
exports.connection.onRequest(coqproto.GoalRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .getGoal();
});
exports.connection.onRequest(coqproto.CachedGoalRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .getCachedGoal(params.position);
});
exports.connection.onRequest(coqproto.QueryRequest.type, (params, token) => __awaiter(this, void 0, void 0, function* () {
    switch (params.queryFunction) {
        case coqproto.QueryFunction.Check:
            return { searchResults: yield exports.project.lookup(params.uri).checkTerm(params.query) };
        case coqproto.QueryFunction.Print:
            return { searchResults: yield exports.project.lookup(params.uri).printTerm(params.query) };
        case coqproto.QueryFunction.Locate:
            return { searchResults: yield exports.project.lookup(params.uri).locateIdent(params.query) };
        case coqproto.QueryFunction.Search:
            return { searchResults: yield exports.project.lookup(params.uri).search(params.query) };
        case coqproto.QueryFunction.SearchAbout:
            return { searchResults: yield exports.project.lookup(params.uri).searchAbout(params.query) };
        default:
            return { searchResults: "" };
    }
}));
exports.connection.onRequest(coqproto.ResizeWindowRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .setWrappingWidth(params.columns);
});
exports.connection.onRequest(coqproto.LtacProfResultsRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .requestLtacProfResults(params.offset);
});
exports.connection.onRequest(coqproto.SetDisplayOptionsRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .setDisplayOptions(params.options);
});
exports.connection.onRequest(coqproto.FinishComputationsRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .finishComputations();
});
exports.connection.onRequest(coqproto.GetSentencePrefixTextRequest.type, (params, token) => {
    return exports.project.lookup(params.uri)
        .getSentencePrefixTextAt(params.position);
});
function sendHighlightUpdates(documentUri, highlights) {
    exports.connection.sendNotification(coqproto.UpdateHighlightsNotification.type, Object.assign(highlights, { uri: documentUri }));
}
function sendDiagnostics(documentUri, diagnostics) {
    exports.connection.sendDiagnostics({
        diagnostics: diagnostics,
        uri: documentUri,
    });
}
exports.connection.onCodeAction((params) => {
    return [];
});
exports.connection.onCodeLens((params) => {
    return [];
});
exports.connection.onCodeLensResolve((params) => {
    return params;
});
exports.connection.onDefinition((params) => {
    const doc = exports.project.lookup(params.textDocument.uri);
    if (!doc)
        return [];
    else
        return doc.provideDefinition(params.position);
});
exports.connection.onDocumentSymbol((params) => {
    const doc = exports.project.lookup(params.textDocument.uri);
    if (!doc)
        return [];
    else
        return doc.provideSymbols();
});
exports.connection.onDocumentLinks((p, token) => {
    return Promise.resolve([]);
    // return project.lookup(p.textDocument.uri)
    // .provideDocumentLinks(token);
});
exports.connection.onDocumentLinkResolve((link, token) => {
    return link;
    // connection.console.log("onDocumentLinkResolve: " + link);
    // return link;  
});
exports.connection.onDidOpenTextDocument((params) => {
    const uri = params.textDocument.uri;
    exports.project.open(params.textDocument, {
        sendHighlightUpdates: (h) => sendHighlightUpdates(uri, h),
        sendDiagnostics: (diagnostics) => sendDiagnostics(uri, diagnostics),
        sendMessage: (level, message, rich_message) => exports.connection.sendNotification(coqproto.CoqMessageNotification.type, {
            level: level,
            message: message,
            uri: uri,
            rich_message: rich_message,
        }),
        sendReset: () => exports.connection.sendNotification(coqproto.CoqResetNotification.type, { uri: uri }),
        sendStmFocus: (focus) => exports.connection.sendNotification(coqproto.CoqStmFocusNotification.type, { uri: uri, position: focus }),
        sendLtacProfResults: (results) => exports.connection.sendNotification(coqproto.CoqLtacProfResultsNotification.type, { uri: uri, results: results }),
    });
});
exports.connection.onDidChangeTextDocument((params) => {
    try {
        return exports.project.lookup(params.textDocument.uri)
            .applyTextEdits(params.contentChanges, params.textDocument.version);
    }
    catch (err) {
        exports.connection.console.error(err.toString());
    }
});
exports.connection.onDidCloseTextDocument((params) => {
    // A text document got closed in VSCode.
    // params.uri uniquely identifies the document.
    exports.project.close(params.textDocument.uri);
});
// Listen on the connection
exports.connection.listen();
//# sourceMappingURL=server.js.map