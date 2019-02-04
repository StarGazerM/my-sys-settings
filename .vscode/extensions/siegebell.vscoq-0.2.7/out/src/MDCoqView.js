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
const view = require('./CoqView');
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
function edit(editor) {
    return new Promise((resolve, reject) => editor.edit(resolve));
}
class MDCoqView {
    constructor(uri) {
        this.currentPos = new vscode.Position(0, 0);
        this.onresize = null;
        this.docUri = uri;
        this.createBuffer();
    }
    createBuffer() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.filename = this.docUri.fsPath + ".view.md";
                fs.close(yield createFile(this.filename));
                const focusedDoc = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
                this.outDoc = yield vscode.workspace.openTextDocument(this.filename);
                // vscode.window.onDidChangeActiveTextEditor((editor) => {
                //   var a = editor.document;
                // });
                this.editor = yield vscode.window.showTextDocument(this.outDoc, vscode.ViewColumn.Two);
                yield vscode.commands.executeCommand('workbench.action.markdown.togglePreview');
                var x = vscode.window.activeTextEditor;
                if (focusedDoc)
                    vscode.window.showTextDocument(focusedDoc);
            }
            catch (err) {
                vscode.window.showErrorMessage(err.toString());
            }
        });
    }
    //   private write(eb: vscode.TextEditorEdit, text: string) {
    //     eb.insert(this.currentPos, text);
    //     const delta = textUtil.positionAt(text, text.length);
    //     this.currentPos = this.currentPos.translate(delta.line, delta.character);
    //   }
    // 
    //   private writeLine(eb: vscode.TextEditorEdit, text: string) {
    //     this.write(eb, text + '\n');
    //   }
    dispose() {
        this.editor.hide();
        fs.unlink(this.filename);
    }
    displayError(state) {
        // this.out.appendLine(state.error.message);
    }
    setOutputText(text) {
        return __awaiter(this, void 0, void 0, function* () {
            yield writeFile(this.filename, text);
            yield this.refreshView();
            // this.editor.edit((eb) => {
            //   // eb.delete(new vscode.Range(0,0,2,0));
            //   // eb.insert(new vscode.Position(0,0), text);
            //   // eb.replace(new vscode.Range(0,0,this.outDoc.lineCount,0), text);
            //   eb.replace(new vscode.Range(0,0,0,this.outDoc.getText().length), text);
            //   // const focusedEditor = vscode.window.activeTextEditor;
            //   // this.editor.show();
            //   // vscode.commands.executeCommand('workbench.action.markdown.togglePreview');
            //   // vscode.commands.executeCommand('workbench.action.markdown.togglePreview');
            //   // if(focusedEditor)
            //     // focusedEditor.show();
            // })
        });
    }
    displayProof(state) {
        let out = "";
        if (view.countAllGoals(state) == 0) {
            out = "No more subgoals.";
        }
        else if (state.type === 'proof-view') {
            if (state.goals.length > 0) {
                state.goals[0].hypotheses.forEach((hyp) => out = out + hyp + '<br/>');
                state.goals.forEach((g, i) => {
                    out = out + `<hr/>(${i + 1}/${state.goals.length})<br/>${g.goal}<br/>`;
                });
            }
            else
                out = "There unfocused goals.";
        }
        this.setOutputText(out);
    }
    displayTop(state) {
        this.editor.edit((eb) => {
            eb.replace(new vscode.Range(0, 0, this.outDoc.lineCount, 0), "Top");
        });
        // const eb = await edit(this.editor);
        // eb.insert(new vscode.Position(0,0), "Hello World");
    }
    refreshView() {
        return __awaiter(this, void 0, void 0, function* () {
            const focusedDoc = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
            yield vscode.window.showTextDocument(this.editor.document, vscode.ViewColumn.Two);
            // vscode.commands.executeCommand('workbench.action.markdown.togglePreview');
            // await vscode.commands.executeCommand('workbench.action.markdown.togglePreview');
            yield vscode.commands.executeCommand('workbench.action.markdown.togglePreview');
            if (focusedDoc)
                vscode.window.showTextDocument(focusedDoc);
        });
    }
    update(state) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (view.getDisplayState(state)) {
                case view.DisplayState.Error:
                    this.displayError(state);
                    break;
                case view.DisplayState.Proof:
                    this.displayProof(state);
                    break;
            }
        });
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.window.showTextDocument(this.editor.document, vscode.ViewColumn.Two);
        });
    }
    showExternal() {
        return Promise.reject('external view is unsupported');
    }
}
exports.MDCoqView = MDCoqView;
//# sourceMappingURL=MDCoqView.js.map