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
const view = require('./CoqView');
const text = require('./AnnotatedText');
class SimpleCoqView {
    constructor(uri) {
        this.onresize = null;
        const name = uri + " - CoqTop";
        this.out = vscode.window.createOutputChannel(name);
        this.out.show(vscode.ViewColumn.Three);
    }
    dispose() {
        this.out.dispose();
    }
    displayError(state) {
        this.out.appendLine(text.textToDisplayString(state.message));
    }
    displayProof(state) {
        let out = "";
        if (view.countAllGoals(state) == 0) {
            out = "No more subgoals.";
        }
        else if (state.type === 'proof-view') {
            if (state.goals.length > 0) {
                state.goals[0].hypotheses.forEach((hyp) => out = out + hyp + '\n');
                state.goals.forEach((g, i) => {
                    out = out + `----------------------(${i + 1}/${state.goals.length})\n${g.goal}\n`;
                });
            }
            else
                out = "There unfocused goals.";
        }
        this.out.append(out);
    }
    displayTop(state) {
    }
    update(state) {
        this.out.clear();
        if (state.type === 'failure')
            this.displayError(state);
        else if (state.type === 'proof-view')
            this.displayProof(state);
    }
    show() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.out.show(vscode.ViewColumn.Two, true);
        });
    }
    showExternal() {
        return Promise.reject('external view is unsupported');
    }
}
exports.SimpleCoqView = SimpleCoqView;
//# sourceMappingURL=SimpleCoqView.js.map