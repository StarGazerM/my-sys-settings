"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const document_1 = require('./document');
const path = require('path');
const fs = require('fs');
const PrettifySymbols_1 = require('./util/PrettifySymbols');
const nodeAsync = require('./util/nodejs-async');
const coqProjectFileName = '_CoqProject';
class CoqProject {
    constructor(workspaceRoot, connection) {
        this.connection = connection;
        this.coqInstances = new Map();
        this.coqProjectWatcher = null;
        this.coqProjectModifiedDate = null;
        this.loadingCoqProjectInProcess = false;
        this.ready = { event: Promise.resolve({}), signal: () => { } };
        this.psm = new PrettifySymbols_1.PrettifySymbolsMode([]);
        // we independently track the settings contributed by the vscode project settings and _CoqProject
        // so they can be modified seperately
        this.settingsCoqTopArgs = [];
        this.coqProjectArgs = [];
        if (workspaceRoot)
            connection.console.log("Loaded project at " + workspaceRoot);
        else
            connection.console.log("Loading project with no root directory");
        this.workspaceRoot = workspaceRoot;
    }
    get console() {
        return this.connection.console;
    }
    getWorkspaceRoot() {
        return this.workspaceRoot;
    }
    lookup(uri) {
        var doc = this.coqInstances.get(uri);
        if (!doc)
            throw 'unknown document: ' + uri;
        return doc;
    }
    /** reset the ready promise */
    notReady() {
        this.ready.event = new Promise((resolve) => {
            this.ready.signal = () => {
                this.ready = { event: Promise.resolve({}), signal: () => { } };
                resolve();
            };
        });
    }
    getPrettifySymbols() {
        return this.psm;
    }
    matchesCoq(selector) {
        if (typeof selector === 'string')
            return selector === 'coq';
        else if (selector instanceof Array)
            return selector.some((s) => this.matchesCoq(s));
        else
            return selector.language === 'coq';
    }
    updateSettings(newSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            this.notReady();
            this.settingsCoqTopArgs = newSettings.coqtop.args;
            this.currentSettings = newSettings;
            if (newSettings.coq.loadCoqProject) {
                this.watchCoqProject();
                yield this.loadCoqProject();
            }
            if (newSettings.prettifySymbolsMode && newSettings.prettifySymbolsMode.substitutions) {
                for (let entry of newSettings.prettifySymbolsMode.substitutions) {
                    if (entry.language && entry.substitutions && this.matchesCoq(entry.language)) {
                        this.psm = new PrettifySymbols_1.PrettifySymbolsMode(entry.substitutions);
                        break;
                    }
                }
            }
            else
                this.psm = new PrettifySymbols_1.PrettifySymbolsMode([]);
            this.ready.signal();
        });
    }
    open(textDocument, callbacks) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ready.event;
            const doc = new document_1.CoqDocument(this, textDocument, this.console, callbacks);
            this.coqInstances.set(doc.uri, doc);
            return doc;
        });
    }
    close(uri) {
        var doc = this.coqInstances.get(uri);
        this.coqInstances.delete(uri);
        if (doc) {
            doc.close();
        }
    }
    coqProjectFile() {
        if (this.workspaceRoot)
            return path.join(this.workspaceRoot, coqProjectFileName);
        else
            return undefined;
    }
    shutdown() {
        this.coqInstances.forEach((x) => x.close());
        this.coqInstances.clear();
    }
    isCoqProjectOutOfDate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currentStat = yield this.getFileStats(this.coqProjectFile());
                return currentStat.mtime > this.coqProjectModifiedDate;
            }
            catch (err) {
                return false;
            }
        });
    }
    watchCoqProject() {
        if (this.coqProjectWatcher != null)
            this.coqProjectWatcher.close();
        if (!this.workspaceRoot)
            return;
        this.coqProjectWatcher = fs.watch(this.workspaceRoot, (event, filename) => __awaiter(this, void 0, void 0, function* () {
            var d = (yield this.getFileStats(this.coqProjectFile())).mtime;
            switch (event) {
                case 'change':
                    if ((filename && filename == coqProjectFileName) || (yield this.isCoqProjectOutOfDate())) {
                        this.console.log(coqProjectFileName + ' changed');
                        yield this.loadCoqProject();
                    }
            }
        }));
    }
    stopWatchingCoqProject() {
        if (this.coqProjectWatcher != null)
            this.coqProjectWatcher.close();
        this.coqProjectWatcher = null;
    }
    getFileStats(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                fs.stat(path, (err, stats) => {
                    if (err)
                        reject(err);
                    else
                        resolve(stats);
                });
            });
        });
    }
    static parseCoqProject(text) {
        const args = [];
        const projectArgs = require('string-argv')(text);
        for (let idx = 0; idx < projectArgs.length; ++idx) {
            const opt = projectArgs[idx];
            if (opt === '-R')
                args.push('-R', projectArgs[++idx], projectArgs[++idx]);
            else if (opt === '-I')
                args.push('-I', projectArgs[++idx]);
            else if (opt === '-Q')
                args.push('-Q', projectArgs[++idx], projectArgs[++idx]);
            else if (opt === '-arg')
                args.push(...require('string-argv')(projectArgs[++idx]));
        }
        return args;
    }
    loadCoqProject() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.workspaceRoot)
                return;
            if (this.loadingCoqProjectInProcess)
                return;
            this.loadingCoqProjectInProcess = true;
            try {
                const stats = yield this.getFileStats(this.coqProjectFile());
                this.coqProjectModifiedDate = stats.mtime;
                const projectFile = yield nodeAsync.fs.readFile(this.coqProjectFile(), 'utf8');
                this.coqProjectArgs = CoqProject.parseCoqProject(projectFile);
                this.currentSettings.coqtop.args = [...this.coqProjectArgs, ...this.settingsCoqTopArgs];
            }
            catch (err) {
                this.coqProjectModifiedDate = null;
            }
            finally {
                this.loadingCoqProjectInProcess = false;
            }
        });
    }
    get settings() {
        return this.currentSettings;
    }
}
exports.CoqProject = CoqProject;
//# sourceMappingURL=CoqProject.js.map