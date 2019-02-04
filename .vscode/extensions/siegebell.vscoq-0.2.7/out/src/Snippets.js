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
function snippetSentence(item) {
    if (typeof item === 'string') {
        const result = new vscode.CompletionItem(item, vscode.CompletionItemKind.Snippet);
        result.insertText = item + ".";
        return result;
    }
    else {
        const result = new vscode.CompletionItem(item.label, vscode.CompletionItemKind.Snippet);
        result.insertText = item.insertText;
        result.documentation = item.documentation;
        return result;
    }
}
const optionsSnippetsRaw = [
    "Asymmetric Patterns",
    "Atomic Load",
    "Automatic Coercions Import",
    "Automatic Introduction",
    "Boolean Equality Schemes",
    "Bracketing Last Introduction Pattern",
    "Subproofs Case Analysis Schemes",
    "Compat Notations",
    "Congruence Depth",
    "Congruence Verbose",
    "Contextual Implicit",
    "Debug Auto",
    "Debug Eauto",
    "Debug Rakam",
    "Debug Tactic Unification",
    "Debug Trivial",
    "Debug Unification",
    "Decidable Equality Schemes",
    "Default Clearing Used Hypotheses",
    "Default Goal Selector",
    "Default Proof Mode",
    "Default Proof Using",
    "Default Timeout",
    "Dependent Propositions Elimination",
    "Discriminate Introduction",
    "Dump Bytecode",
    "Elimination Schemes",
    "Equality Scheme",
    "Extraction Auto Inline",
    "Extraction Conservative Types",
    "Extraction File Comment",
    "Extraction Flag",
    "Extraction Keep Singleton",
    "Extraction Optimize",
    "Extraction Safe Implicits",
    "Extraction Type Expand",
    "Firstorder Depth",
    "Hide Obligations",
    "Implicit Arguments",
    "Info Auto",
    "Info Eauto",
    "Info Level",
    "Info Trivial",
    "Injection L2 Rpattern Order",
    "Injection On Proofs",
    "Inline Level",
    "Intuition Iff Unfolding",
    "Intuition Negation Unfolding",
    "Kernel Term Sharing",
    "Keyed Unification",
    "Loose Hint Behavior",
    "Maximal Implicit Insertion",
    "Nonrecursive Elimination Schemes",
    "Parsing Explicit",
    "Primitive Projections",
    "Printing All",
    "Printing Coercions",
    "Printing Depth",
    "Printing Existential Instances",
    "Printing Implicit",
    "Printing Implicit Defensive",
    "Printing Matching",
    "Printing Notations",
    "Printing Primitive Projection Compatibility",
    "Printing Primitive Projection Parameters",
    "Printing Projections",
    "Printing Records",
    "Printing Synth",
    "Printing Universes",
    "Printing Width",
    "Printing Wildcard",
    "Program Mode",
    "Proof Using Clear Unused",
    "Record Elimination Schemes",
    "Regular Subst Tactic",
    "Reversible Pattern Implicit",
    "Rewriting Schemes",
    "Short Module Printing",
    "Shrink Obligations",
    "Simpl Is Cbn",
    "Standard Proposition Elimination Names",
    "Strict Implicit",
    "Strict Proofs",
    "Strict Universe Declaration",
    "Strongly Strict Implicit",
    "Suggest Proof Using",
    "Tactic Compat Context",
    "Tactic Evars Pattern Unification",
    "Transparent Obligations",
    "Typeclass Resolution After Apply",
    "Typeclass Resolution For Conversion",
    "Typeclasses Debug",
    "Typeclasses Dependency Order",
    "Typeclasses Depth",
    "Typeclasses Modulo Eta",
    "Typeclasses Strict Resolution",
    "Typeclasses Unique Instances",
    "Typeclasses Unique Solutions",
    "Universal Lemma Under Conjunction",
    "Universe Minimization To Set",
    "Universe Polymorphism",
    "Verbose Compat Notations"
];
const optionsSnippets = [
    ...optionsSnippetsRaw,
    "Hyps Limit",
    "Bullet Behavior",
].map(snippetSentence);
;
const setOptionsSnippets = [
    ...optionsSnippetsRaw,
    { label: "Hyps Limit", insertText: "Hyps Limit {{num}}." },
    'Bullet Behavior "None"',
    'Bullet Behavior "Strict Subproofs"',
].map(snippetSentence);
const printSnippets = [
    "All",
    { label: "All Dependencies", insertText: "All Dependencies {{qualid}}." },
    { label: "Assumptions", insertText: "Assumptions {{qualid}}." },
    "Canonical Projections",
    "Classes",
    { label: "Coercion Paths", insertText: "Coercion Paths {{class1}} {{class2}}." },
    "Coercions",
    "Extraction Inline",
    "Fields",
    "Grammar constr",
    "Grammar pattern",
    "Graph",
    { label: "Hint", insertText: "Hint {{ident}}." },
    "Hint *",
    { label: "HintDb", insertText: "HintDb {{ident}}." },
    { label: "Implicit", insertText: "HintDb {{qualid}}." },
    "Libraries",
    "LoadPath",
    { label: "Ltac", insertText: "Ltac {{qualid}}." },
    "ML Modules",
    "ML Path",
    { label: "Module", insertText: "Module {{ident}}." },
    { label: "Module Type", insertText: "Module Type {{ident}}." },
    { label: "Opaque Dependencies", insertText: "Opaque Dependencies {{qualid}}." },
    "Options",
    "Rings",
    { label: "Scope", insertText: "Scope {{scope}}." },
    "Scopes",
    { label: "Section", insertText: "Section {{ident}}." },
    "Sorted Universes",
    { label: "Sorted Universes (filename)", insertText: "Sorted Universes {{filename}}." },
    "Strategies",
    { label: "Strategy", insertText: "Strategy {{qualid}}." },
    "Table Printing If",
    "Table Printing Let",
    "Tables",
    { label: "Term", insertText: "Term {{qualid}}." },
    { label: "Transparent Dependencies", insertText: "Transparent Dependencies {{qualid}}." },
    "Universes",
    { label: "Universes (filename)", insertText: "Universes {{filename}}." },
    "Visibility",
].map(snippetSentence);
const showSnippets = [
    { label: "(num)", insertText: " {{num}}.", documentation: "Displays only the num-th subgoal" },
    "Script",
    "Proof",
    "Conjecturest",
    "Intro",
    "Intros",
    "Existentials",
    "Universes",
].map(snippetSentence);
const hintSnippets = [
    { label: "(definition)", insertText: " {{definition}}." },
    { label: "Constructors", insertText: "Constructors {{idents …}}." },
    { label: 'Cut', insertText: 'Cut "{{regexp}}".' },
    { label: 'Extern', insertText: 'Extern {{num}} {{optional-pattern}} => {{tactic}}.' },
    { label: 'Immediate', insertText: 'Immediate {{term}}.' },
    { label: 'Mode', insertText: 'Mode {{(+|-)*}} {{qualid}}.' },
    { label: 'Opaque', insertText: 'Opaque {{qualid}}.' },
    { label: 'Resolve', insertText: 'Resolve {{term}}.' },
    { label: 'Rewrite', insertText: 'Rewrite {{terms …}} : {{idents …}}.' },
    { label: 'Rewrite ->', insertText: 'Rewrite -> {{terms …}} : {{idents …}}.' },
    { label: 'Rewrite <-', insertText: 'Rewrite <- {{terms …}} : {{idents …}}.' },
    { label: 'Transparent', insertText: 'Transparent {{qualid}}.' },
    { label: 'Unfold', insertText: 'Unfold {{qualid}}.' },
    'Mode',
    'Proof',
    'Conjecturest',
    'Intro',
    'Intros',
    'Existentials',
    'Universes',
].map(snippetSentence);
const triggerSnippets = [
    { label: "Set...", insertText: "Set ", completion: setOptionsSnippets, detail: "Set coqtop options" },
    { label: "Unset...", insertText: "Unset ", completion: optionsSnippets, detail: "Unset coqtop options" },
    { label: "Local Set...", insertText: "Local Set ", completion: setOptionsSnippets },
    { label: "Global Unset...", insertText: "Global Unset ", completion: optionsSnippets },
    { label: "Test...", insertText: "Test ", completion: optionsSnippets },
    { label: "Print...", insertText: "Print ", completion: printSnippets },
    { label: "Show...", insertText: "Show ", completion: showSnippets },
    { label: "Arguments", insertText: "Arguments {{qualid}} {{possibly_bracketed_idents …}}." },
    { label: "Local Arguments", insertText: "Local Arguments {{qualid}} {{possibly_bracketed_idents …}}." },
    { label: "Global Arguments", insertText: "Global Arguments {{qualid}} {{possibly_bracketed_idents …}}." },
];
let triggerRegexp;
function getTriggerSnippet(str) {
    const match = triggerRegexp.exec(str);
    if (match && match.length > 1) {
        match.shift();
        const triggerIdx = match.findIndex((v) => v !== undefined);
        return triggerSnippets[triggerIdx];
    }
    else
        return null;
}
function getTriggerCompletions(prefix) {
    const triggerCompletions = new vscode.CompletionList(triggerSnippets
        .filter((trigger) => {
        return trigger.insertText.startsWith(prefix);
    })
        .map((trigger) => {
        const item = new vscode.CompletionItem(trigger.label);
        item.insertText = trigger.insertText;
        item.detail = trigger.detail;
        if (trigger.completion)
            item.command = {
                command: "editor.action.triggerSuggest",
                title: "Trigger Suggest",
                arguments: [vscode.window.activeTextEditor]
            };
        return item;
    }), true);
    return triggerCompletions;
}
function setupSnippets(subscriptions) {
    triggerRegexp = RegExp(`\\s*(?:${triggerSnippets.map((v) => "(" + escapeRegExp(v.insertText) + ")").join('|')})\\s*$`);
    const triggerTerminators = triggerSnippets.map((trigger) => trigger.insertText[trigger.insertText.length - 1]);
    // Set-Options snippets are registered manually because coq.json snippets
    // don't currently provide a nice interaction.
    subscriptions.push(vscode.languages.registerCompletionItemProvider('coq', {
        provideCompletionItems: (doc, pos, token) => __awaiter(this, void 0, void 0, function* () {
            try {
                const prefix = yield CoqLanguageServer_1.CoqLanguageServer.getInstance().getPrefixText(doc.uri.toString(), pos, token);
                if (prefix === "")
                    return [];
                const trigger = getTriggerSnippet(prefix);
                if (trigger)
                    return trigger.completion;
                else
                    return getTriggerCompletions(prefix.trim());
            }
            catch (err) {
                return [];
            }
        })
    }, ...triggerTerminators));
    const qedCompletion = new vscode.CompletionItem("Qed.", vscode.CompletionItemKind.Snippet);
    const definedCompletion = new vscode.CompletionItem("Defined.", vscode.CompletionItemKind.Snippet);
    const admittedCompletion = new vscode.CompletionItem("Admitted.", vscode.CompletionItemKind.Snippet);
    const outdentCompletions = [qedCompletion, definedCompletion, admittedCompletion];
    subscriptions.push(vscode.languages.registerCompletionItemProvider('coq', {
        provideCompletionItems: (doc, pos, token) => __awaiter(this, void 0, void 0, function* () {
            try {
                const line = doc.lineAt(pos.line);
                // outdent the text
                const indentSize = getIndentSize(doc);
                const insertLine = { command: "editor.action.insertLineAfter", arguments: [], title: "insert line" };
                const outdentRange = new vscode.Range(line.lineNumber, Math.max(0, line.firstNonWhitespaceCharacterIndex - indentSize), line.lineNumber, line.firstNonWhitespaceCharacterIndex);
                const outdent = new vscode.TextEdit(outdentRange, '');
                outdentCompletions.forEach(o => {
                    o.additionalTextEdits = [outdent];
                    o.command = insertLine;
                });
                return outdentCompletions;
            }
            catch (err) {
                return [];
            }
        })
    }));
}
exports.setupSnippets = setupSnippets;
function getIndentSize(doc) {
    let editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri === doc.uri)
        return editor.options.insertSpaces ? +editor.options.tabSize : 1;
    editor = vscode.window.visibleTextEditors.find((e) => e.document.uri === doc.uri);
    if (editor && editor.document.uri === doc.uri)
        return editor.options.insertSpaces ? +editor.options.tabSize : 1;
    else
        return 0;
}
/** see: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex */
function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}
//# sourceMappingURL=Snippets.js.map