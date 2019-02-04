"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const http = require('http');
const WebSocket = require('ws');
const vscode = require('vscode');
class WebDocumentProvider {
    constructor() {
        this.onDidChangeEmitter = new vscode.EventEmitter();
        this.evalResults = new Map();
        this.nextEvalId = 0;
        this.httpServer = http.createServer();
        this.serverReady = new Promise((resolve, reject) => this.httpServer.listen(0, 'localhost', undefined, (e) => {
            if (e)
                reject(e);
            else
                resolve();
        }));
        this.server = new WebSocket.Server({ server: this.httpServer });
        this.server.on('connection', (ws) => {
            this.evalResults.set(ws, new Map());
            ws.onclose = (event) => {
                this.cancelPromises(event.reason, this.evalResults.get(ws).values());
                this.evalResults.delete(ws);
            };
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.type === "data")
                    this.onData(ws, message.data);
                else if (message.type === "result") {
                    const promises = this.evalResults.get(ws);
                    const promise = promises.get(message.callId);
                    if (promise) {
                        promises.delete(message.callId);
                        promise.resolve(message.result);
                    }
                }
            };
            if (this.currentAnchor)
                this.sendMessage({ type: "goto", goto: this.currentAnchor }, [ws]);
            this.onConnection(ws);
        });
    }
    cancelPromises(reason, promises) {
        for (let promise of promises)
            promise.reject(reason);
    }
    sendMessageToClient(message, callId, client, token) {
        try {
            if (client.readyState !== client.OPEN)
                return Promise.resolve(undefined);
            client.send(JSON.stringify(message));
            const promises = this.evalResults.get(client);
            return new Promise((resolve, reject) => {
                promises.set(callId, { resolve: resolve, reject: reject });
                if (token)
                    token.onCancellationRequested((e) => {
                        promises.delete(callId);
                        reject(e);
                    });
            });
        }
        catch (err) {
            return Promise.reject(err);
        }
    }
    sendMessage(message, clients = this.server.clients, token) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.serverReady;
            const evalId = this.nextEvalId++;
            message['callId'] = evalId;
            if (!clients)
                clients = this.server.clients;
            return yield Promise.all(clients.map((connection) => this.sendMessageToClient(message, evalId, connection, token)));
        });
    }
    send(data, clients = this.server.clients) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendMessage({ type: "data", data: data }, clients);
        });
    }
    setSourceHTML(htmlSource, clients = this.server.clients, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentAnchor = options.goto;
            const anchor = options.goto ? options.goto.anchor : undefined;
            const highlight = options.goto ? options.goto.highlight : undefined;
            yield this.sendMessage({ type: "set-srcdoc", sourceHtml: htmlSource, goto: options.goto }, clients);
        });
    }
    setSourceUri(uri, clients = this.server.clients, options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentAnchor = options.goto;
            const anchor = options.goto ? options.goto.anchor : undefined;
            const highlight = options.goto ? options.goto.highlight : undefined;
            yield this.sendMessage({ type: "set-src", uri: uri.toString(), goto: options.goto }, clients);
        });
    }
    eval(code, clients = this.server.clients, token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sendMessage({ type: "eval", code: code }, clients);
        });
    }
    get clients() {
        return this.server.clients;
    }
    goto(anchor, highlight, clients = this.server.clients) {
        return __awaiter(this, void 0, void 0, function* () {
            this.currentAnchor = { anchor: anchor, highlight: highlight };
            yield this.sendMessage({ type: "goto", goto: this.currentAnchor }, clients);
        });
    }
    provideTextDocumentContent(uri, token) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.serverReady;
            const { address: address, port: port } = this.httpServer.address();
            const source = yield this.provideSource(uri, token);
            let ifattr = "";
            if (source instanceof vscode.Uri)
                ifattr = `src="${source.toString()}"`;
            else if (typeof source === 'string')
                ifattr = `srcdoc="${source}"`;
            const WEB_SOCKET_ADDRESS = `ws://${address}:${port}`;
            return `<!DOCTYPE HTML>
<head>
<script type="text/javascript">
let observer = new MutationObserver(function(mutations) {
    let host = document.getElementById("host");
    const doc = host.contentWindow.document;
    applyStyles(doc);
  });

window.addEventListener('message', function(event) {
  connection.send(JSON.stringify({type:"data", data: event.data}))
}, false);

let simulateAnchor = document.createElement('a');
simulateAnchor.style.display = 'none';


let connection = null;

function load() {
  if(connection)
    connection.close();

  let host = document.getElementById("host");
  connection = new WebSocket("${WEB_SOCKET_ADDRESS}");
  connection.onmessage = function (event) {
    message = JSON.parse(event.data);
    if(!host)
      return;
    if(message.type === 'set-srcdoc') {
      host.onload = function() {
        initializeDoc(host.contentWindow.document, message.goto);
        connection.send(JSON.stringify({type:"result", result: undefined, callId: message.callId}));
      }
      host.srcdoc = message.sourceHtml;
    } else if(message.type === 'set-src') {
      host.onload = function() {
        initializeDoc(host.contentWindow.document, message.goto);
        connection.send(JSON.stringify({type:"result", result: undefined, callId: message.callId}));
      }
      host.src = message.uri;
    } else if(message.type === 'goto') {
      gotoAnchor(host.contentWindow.document, message.goto);  
      connection.send(JSON.stringify({type:"result", result: undefined, callId: message.callId}));
    } else if(message.type === 'data') {
      host.contentWindow.postMessage(message.data, "*");
      connection.send(JSON.stringify({type:"result", result: undefined, callId: message.callId}));
    } else if(message.type === 'eval') {
      const result = host.contentWindow.eval(message.code);
      connection.send(JSON.stringify({type:"result", result: result, callId: message.callId}));
    }
  }
  connection.onclose = function (event) {
    connection = null;
  }

  observer.disconnect();
  observer.observe(document.body, { attributes : true, attributeFilter: ['class'] });
  document.body.appendChild(simulateAnchor);

  initializeDoc(host.contentWindow.document, undefined);
}
let clickEvent = new MouseEvent('click', {view: window, bubbles: true, cancelable: true});
function initializeDoc(doc, goto) {
  applyStyles(doc);
  if(goto)
    gotoAnchor(doc, goto);  
}

function gotoAnchor(doc, goto) {
  if(!goto)
    return;
  const elem = doc.getElementById(goto.anchor);
  if(!elem)
    return;
  elem.scrollIntoView();
  if(goto.highlight)
    elem.style.backgroundColor = goto.highlight;
}
function unload() {
  console.log("UNloading");
}
function applyStyles(doc) {
  var styleSheets = document.styleSheets;
  var cssString = "";
  for (var i = 0, count = styleSheets.length; i < count; ++i) {
    if (styleSheets[i].cssRules) {
      var cssRules = styleSheets[i].cssRules;
      for (var j = 0, countJ = cssRules.length; j < countJ; ++j)
        cssString += cssRules[j].cssText;
    }
    else
      cssString += styleSheets[i].cssText;  // IE8 and earlier
  }
  var style = doc.createElement("style");
  style.type = "text/css";
  style.innerHTML = cssString;
  doc.getElementsByTagName("head")[0].appendChild(style);
  doc.body.classList.add(...document.body.classList);
}
</script>
</head>
<body onload="load()" style="margin:0px;padding:0px;width:100%;height:100vh;border:none;position:absolute;top:0px;left:0px;right:0px;bottom:0px">
<iframe id="host" seamless style="position:absolute;top:0px;left:0px;right:0px;bottom:0px;border:none;margin:0px;padding:0px;width:100%;height:100%" ${ifattr} />
</body>`;
        });
    }
    get onDidChange() {
        return this.onDidChangeEmitter.event;
    }
}
exports.WebDocumentProvider = WebDocumentProvider;
//# sourceMappingURL=WebDocumentProvider.js.map