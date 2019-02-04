"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode = require('vscode');
const CoqLanguageServer_1 = require('./CoqLanguageServer');
const sexpr = require('sexpr-plus');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const WebDocumentProvider_1 = require('./WebDocumentProvider');
function evalSExprContent(expr) {
    if (expr.type === "list")
        return expr.content.map(evalSExprContent);
    else
        return expr.content;
}
function parseEListSnippet(snippet) {
    const identsCount = {};
    // Count each identifier
    snippet.replace(/@{(.*?)}/g, (m, id, offset) => { identsCount[id] = (identsCount[id] || 0) + 1; return m; });
    const identsNext = {};
    for (let key in identsCount) {
        if (identsCount[key] > 1)
            identsNext[key] = 1;
    }
    const insertText = snippet
        .replace(/@{(.*?)}/g, (m, id, offset) => {
        const num = identsNext[id];
        if (num === undefined)
            return `{{${id}}}`;
        else {
            ++identsNext[id];
            return `{{${id}${num}}}`;
        }
    });
    const label = snippet
        .replace(/@{(.*?)}/g, (m, id) => `\[${id}\]`)
        .replace(/[.]$/, '');
    return { insertText: insertText, label: label };
}
function fsExists(path) {
    return new Promise((resolve, reject) => {
        fs.exists(path, (ex) => resolve(ex));
    });
}
function fsReadFile(filename, options) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, options, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}
function zlibGunzip(data) {
    return new Promise((resolve, reject) => {
        zlib.gunzip(data, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}
class CoqRefmanProvider extends WebDocumentProvider_1.WebDocumentProvider {
    constructor(context) {
        super();
        this.context = context;
        this.scheme = "coq-refman";
        this.baseAddr = `${this.scheme}://local/`;
        this.currentHtml = "";
        this.currentFileId = "";
        this.currentAnchorId = "";
        this.history = [];
        this.historyForward = [];
        this.uri = vscode.Uri.parse("coq-refman://local/");
    }
    onConnection(ws) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.refresh([ws]);
        });
    }
    onData(ws, data) {
        if (data.type === 'navigate') {
            const uri = vscode.Uri.parse(data.url);
            const docFile = uri.path;
            const docId = uri.fragment;
            this.history.push({ docFile: docFile, docId: docId });
            this.historyForward = [];
            this.navigateTo(docFile, docId, true);
        }
        else if (data.type === 'navigateBack') {
            if (this.history.length <= 1)
                return;
            this.historyForward.push(this.history.pop());
            const { docFile: backDocFile, docId: backDocId } = this.history[this.history.length - 1];
            this.navigateTo(backDocFile, backDocId, true);
        }
        else if (data.type === 'navigateForward') {
            if (this.historyForward.length === 0)
                return;
            const { docFile: docFile, docId: docId } = this.historyForward.pop();
            this.history.push({ docFile: docFile, docId: docId });
            this.navigateTo(docFile, docId, true);
        }
    }
    provideSource(uri, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const docFile = uri.path;
            const docId = uri.fragment;
            try {
                return yield this.getSource(docFile);
            }
            catch (err) {
                return undefined;
            }
        });
    }
    getSource(docFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentFileId !== docFile) {
                const file = this.context.asAbsolutePath(path.join('../company-coq/refman', docFile));
                try {
                    if (yield fsExists(file)) {
                        this.currentHtml = yield fsReadFile(file, 'utf8');
                    }
                    else if (yield fsExists(file + '.gz')) {
                        this.currentHtml = (yield zlibGunzip(yield fsReadFile(file + '.gz'))).toString();
                    }
                    else
                        throw "File not found";
                }
                catch (err) {
                    throw err;
                }
            }
            return this.currentHtml;
        });
    }
    navigateTo(docFile, docId, passive = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!passive) {
                this.uri = vscode.Uri.parse(this.baseAddr + docFile + '#' + docId);
                yield vscode.commands.executeCommand('vscode.previewHtml', this.uri, vscode.ViewColumn.Two, "Coq Refman");
            }
            else {
                yield this.getSource(docFile);
                if (this.currentFileId !== docFile || this.currentAnchorId !== docId) {
                    this.currentFileId = docFile;
                    this.currentAnchorId = docId;
                    yield this.refresh();
                }
            }
        });
    }
    show(docFile, docId, passive = false) {
        return __awaiter(this, void 0, void 0, function* () {
            this.history[Math.max(this.history.length - 1, 0)] = { docFile: docFile, docId: docId };
            this.historyForward = [];
            yield this.navigateTo(docFile, docId, passive);
        });
    }
    refresh(clients = this.clients) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setSourceHTML(this.currentHtml, clients, { goto: { anchor: this.currentAnchorId, highlight: 'rgba(204, 204, 0, 0.5)' } });
            yield this.eval(`
      const style = document.createElement("style");
      style.type = "text/css";
      style.innerHTML =
        ".vscode-dark a:link, .vscode-dark a:visited {color: yellow;} " +
        ".vscode-light a:link, .vscode-light a:visited {color: darkblue;} " +
        "#navBarPlaceholder {width: 100%; visibility: hidden} " +
        "#navBar {position: fixed; top:0; width: 100%; z-index: 100; background-color: var(--background-color)}";
      document.getElementsByTagName("head")[0].appendChild(style);
      const navBar = document.createElement('div');
      navBar.innerHTML = '<div id="navBarPlaceholder">NAVBAR</div><div id="navBar"><a href="javascript:onBack()">&lt;&lt;&lt;BACK</a>&nbsp;&nbsp;&nbsp;&nbsp;<a href="javascript:onForward()">FORWARD&gt;&gt;&gt;</a></div>';
      document.body.insertBefore(navBar, document.body.childNodes[0]);
      function onBack() {
        console.log("back");
        parent.window.postMessage({type: "navigateBack"}, "*");        
      }
      function onForward() {
        console.log("forward");
        parent.window.postMessage({type: "navigateForward"}, "*");        
      }
      document.addEventListener('click', function(e) {
        if(e.target.constructor.name === 'HTMLAnchorElement' && e.target.href.startsWith("${this.scheme}" + ":")) {
          e.preventDefault();
          parent.window.postMessage({type: "navigate", url: e.target.href}, "*");
        }
      }, false)
    `, clients);
        });
    }
}
let currentSnippetItem = null;
let coqRefmanProvider = null;
function showSnippetHelp() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!currentSnippetItem)
            return;
        if (currentSnippetItem.hasOwnProperty('docFile') && currentSnippetItem.hasOwnProperty('docId')) {
            try {
                const docFile = currentSnippetItem['docFile'];
                const docId = "qh" + currentSnippetItem['docId'];
                yield coqRefmanProvider.show(docFile + '.html', docId);
            }
            catch (err) {
                console.warn(err.toString());
            }
        }
        else {
            vscode.commands.executeCommand("toggleSuggestionDetails");
        }
    });
}
exports.showSnippetHelp = showSnippetHelp;
const _trimLeft = String.prototype['trimLeft'] || function () {
    return this.replace(/^\s+/, '');
};
function trimLeft(s) {
    return _trimLeft.apply(s);
}
function loadSnippets(key, constDefinitions) {
    const abbreviations = constDefinitions.get(key);
    if (abbreviations && abbreviations.type === 'list' && abbreviations.content[0].content === 'list') {
        const snippets = [];
        abbreviations.content.shift();
        const abbrevs = evalSExprContent(abbreviations);
        for (let [, [text, , [docFile, , docId]]] of abbrevs) {
            const snippet = parseEListSnippet(text);
            const item = new vscode.CompletionItem(snippet.label, vscode.CompletionItemKind.File);
            item['docFile'] = docFile;
            item['docId'] = docId;
            item.insertText = snippet.insertText;
            snippets.push(item);
        }
        return snippets;
    }
    else
        return [];
}
function provideCompletions(provider, ...triggerCharacters) {
    return vscode.languages.registerCompletionItemProvider('coq', {
        provideCompletionItems: (doc, pos, token) => __awaiter(this, void 0, void 0, function* () {
            try {
                return provider(doc, pos, token);
            }
            catch (err) {
                return [];
            }
        }),
        resolveCompletionItem: (item) => {
            currentSnippetItem = item;
            if (currentSnippetItem.hasOwnProperty('docFile') && currentSnippetItem.hasOwnProperty('docId')) {
                try {
                    const docFile = currentSnippetItem['docFile'];
                    const docId = "qh" + currentSnippetItem['docId'];
                    coqRefmanProvider.show(docFile + '.html', docId, true);
                }
                catch (err) {
                    console.warn(err.toString());
                }
            }
            return item;
        }
    }, ...triggerCharacters);
}
function loadCompanyCoq(context) {
    return __awaiter(this, void 0, void 0, function* () {
        coqRefmanProvider = new CoqRefmanProvider(context);
        var registration = vscode.workspace.registerTextDocumentContentProvider('coq-refman', coqRefmanProvider);
        try {
            const abbrevFile = context.asAbsolutePath('../company-coq/company-coq-abbrev.el');
            const text = yield new Promise((resolve, reject) => fs.readFile(abbrevFile, { encoding: 'utf8' }, (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(data);
            }));
            const constDefinitions = new Map();
            const abbrev = sexpr.parse(text);
            abbrev.forEach((entry) => {
                if (entry.type === "list" && entry.content[0].content === 'defconst') {
                    constDefinitions.set(entry.content[1].content.toString(), entry.content[2]);
                }
            });
            const vernacSnippets = loadSnippets("company-coq--refman-vernac-abbrevs", constDefinitions);
            const tacticSnippets = loadSnippets("company-coq--refman-tactic-abbrevs", constDefinitions);
            const ltacSnippets = loadSnippets("company-coq--refman-ltac-abbrevs", constDefinitions);
            const scopeSnippets = loadSnippets("company-coq--refman-scope-abbrevs", constDefinitions);
            vernacSnippets.forEach((s) => {
                let match;
                if (match = /^Section \[([a-zA-Z0-9]*)\]/.exec(s.label))
                    s.insertText = `${s.insertText}\n\t{{ }}\nEnd {{${match[1]}}}.`;
                else if (match = /^Module(?: \[Import\|Export\])? \[([a-zA-Z0-9]*)\](?:[^:]|:(?!=))*$/.exec(s.label))
                    s.insertText = `${s.insertText}\n\t{{ }}\nEnd {{${match[1]}}}.`;
                else if (match = /^Module Type \[([a-zA-Z0-9]*)\](?:[^:]|:(?!=))*$/.exec(s.label))
                    s.insertText = `${s.insertText}\n\t{{ }}\nEnd {{${match[1]}}}.`;
            });
            context.subscriptions.push(provideCompletions((doc, pos, token) => __awaiter(this, void 0, void 0, function* () {
                const prefix = yield CoqLanguageServer_1.CoqLanguageServer.getInstance().getPrefixText(doc.uri.toString(), pos, token);
                return new vscode.CompletionList(vernacSnippets
                    .filter((s) => s.insertText.startsWith(prefix.trim()))
                    .map((i) => {
                    i.textEdit = {
                        newText: i.insertText,
                        range: new vscode.Range(pos.translate(0, -trimLeft(prefix).length), pos)
                    };
                    return i;
                }), true);
            })));
            context.subscriptions.push(provideCompletions((doc, pos, token) => __awaiter(this, void 0, void 0, function* () { return tacticSnippets.concat(...ltacSnippets); })));
            context.subscriptions.push(provideCompletions((doc, pos, token) => __awaiter(this, void 0, void 0, function* () { return scopeSnippets; }), "%"));
        }
        catch (err) {
            console.log(err);
        }
    });
}
exports.loadCompanyCoq = loadCompanyCoq;
//# sourceMappingURL=CompanyCoqSnippets.js.map