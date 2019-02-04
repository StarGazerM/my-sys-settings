"use strict";
const parser = require('../parsing/coq-parser');
const textUtil = require('../util/text-util');
// class QualId extends Array<string> {
//   public contains(id: QualId|string[]) : boolean {
//     return containsQualId(this,id); 
//   }
//   public resolve(id: QualId|string[]) : QualId | null {
//     return resolveQualId(this,id); 
//   }
//   public match(x: QualId|string[]) : QualId|null {
//     return matchQualId(this,x);
//   }
// }
// export function containsQualId(id1: QualId, id2: QualId) : boolean {
//   if(id2.length > id1.length)
//     return false;
//   for(let idx = 1; idx <= id2.length; ++idx) {
//     const fPart = id1[id1.length - idx];
//     const sPart = id2[id2.length - idx];
//     if(fPart !== sPart)
//       return false;
//   }
//   return true;
// }
function resolveQualId(id1, id2) {
    if (id2.length > id1.length)
        return null;
    let idx = 1;
    for (; idx <= id2.length; ++idx) {
        const fPart = id1[id1.length - idx];
        const sPart = id2[id2.length - idx];
        if (fPart !== sPart)
            return null;
    }
    return [...id1.slice(0, id1.length - idx + 1), ...id2];
}
exports.resolveQualId = resolveQualId;
function matchQualId(x, y) {
    let which = 0;
    if (x.length > y.length)
        [which, x, y] = [1, y, x];
    // x is now the shortest
    let idx = 1;
    for (; idx <= x.length; ++idx) {
        const partX = x[x.length - idx];
        const partY = y[y.length - idx];
        if (partX !== partY)
            return null;
    }
    return {
        which: which,
        prefix: y.slice(0, y.length - idx + 1),
        id: x };
}
exports.matchQualId = matchQualId;
function qualIdEqual(x, y) {
    if (x.length !== y.length)
        return false;
    for (let idx = 0; idx < x.length; ++idx) {
        if (x[idx] !== y[idx])
            return false;
    }
    return true;
}
exports.qualIdEqual = qualIdEqual;
(function (SymbolKind) {
    SymbolKind[SymbolKind["Definition"] = 0] = "Definition";
    SymbolKind[SymbolKind["Class"] = 1] = "Class";
    SymbolKind[SymbolKind["Inductive"] = 2] = "Inductive";
    SymbolKind[SymbolKind["Constructor"] = 3] = "Constructor";
    SymbolKind[SymbolKind["Module"] = 4] = "Module";
    SymbolKind[SymbolKind["Let"] = 5] = "Let";
    SymbolKind[SymbolKind["Section"] = 6] = "Section";
    SymbolKind[SymbolKind["Ltac"] = 7] = "Ltac";
    SymbolKind[SymbolKind["Assumption"] = 8] = "Assumption";
})(exports.SymbolKind || (exports.SymbolKind = {}));
var SymbolKind = exports.SymbolKind;
(function (ScopeFlags) {
    ScopeFlags[ScopeFlags["Private"] = 1] = "Private";
    ScopeFlags[ScopeFlags["Local"] = 2] = "Local";
    ScopeFlags[ScopeFlags["Export"] = 4] = "Export";
    ScopeFlags[ScopeFlags["All"] = 7] = "All";
})(exports.ScopeFlags || (exports.ScopeFlags = {}));
var ScopeFlags = exports.ScopeFlags;
class ScopeDeclaration {
    constructor(
        /** The sentence which defined this scope */
        source, myId, node) {
        this.source = source;
        this.myId = myId;
        this.node = node;
        /** Symbols that are available within this scope. */
        this.privateSymbols = [];
        /** Symbols that are made available to this scope's subsequent siblings. */
        this.localSymbols = [];
        /** Symbols that are made available outside of this scope's parent. */
        this.exportSymbols = [];
    }
    static createSection(source, name, range) {
        const result = new ScopeDeclaration(source, [], { kind: "begin", name: name, exports: true });
        result.privateSymbols.push({ identifier: name, range: range, kind: SymbolKind.Section });
        return result;
    }
    static createModule(source, name, exports, range) {
        const result = new ScopeDeclaration(source, [name], { kind: "begin", name: name, exports: exports });
        result.exportSymbols.push({ identifier: name, range: range, kind: SymbolKind.Module });
        return result;
    }
    static createEnd(source, name) {
        const result = new ScopeDeclaration(source, [], { kind: "end", name: name });
        return result;
    }
    static createDefinition(source, name, range) {
        const result = new ScopeDeclaration(source, [], null);
        result.exportSymbols.push({ identifier: name, range: range, kind: SymbolKind.Module });
        return result;
    }
    addPrivateSymbol(s) {
        this.privateSymbols.push(s);
    }
    addLocalSymbol(s) {
        this.localSymbols.push(s);
    }
    addExportSymbol(s) {
        this.exportSymbols.push(s);
    }
    lookupSymbolInList(id, symbols) {
        const matchedId = matchQualId(id.slice(0, id.length - 1), this.myId);
        if (!matchedId)
            return null;
        let assumedPrefix = [];
        if (matchedId.which === 1)
            assumedPrefix = matchedId.prefix;
        for (let s of symbols) {
            if (id[id.length - 1] === s.identifier)
                return {
                    symbol: s,
                    assumedPrefix: assumedPrefix,
                    id: matchedId.id.concat(s.identifier),
                    source: this.source,
                };
        }
        return null;
    }
    lookupHere(id, flags) {
        if (flags & ScopeFlags.Private) {
            const result = this.lookupSymbolInList(id, this.privateSymbols);
            if (result)
                return result;
        }
        if (flags & ScopeFlags.Local) {
            const result = this.lookupSymbolInList(id, this.localSymbols);
            if (result)
                return result;
        }
        if (flags & ScopeFlags.Export) {
            const result = this.lookupSymbolInList(id, this.exportSymbols);
            if (result)
                return result;
        }
        return null;
    }
    getPreviousSentence() {
        if (this.source.prev)
            return this.source.prev.getScope();
        else
            return null;
    }
    getNextSentence() {
        if (this.source.next)
            return this.source.next.getScope();
        else
            return null;
    }
    isBegin(name) {
        return (this.node && this.node.kind === "begin" && (!name || name === this.node.name)) ? true : false;
    }
    isEnd(name) {
        return (this.node && this.node.kind === "end" && (!name || name === this.node.name)) ? true : false;
    }
    getParentScope() {
        let nesting = 0;
        let scope = this.getPreviousSentence();
        while (scope) {
            if (scope.isEnd())
                ++nesting;
            else if (scope.isBegin() && nesting > 0)
                --nesting;
            else if (scope.isBegin() && nesting === 0)
                return scope;
            scope = scope.getPreviousSentence();
        }
        return null;
    }
    getPrefixes() {
        let prefixes = [];
        let scope = this.getParentScope();
        while (scope) {
            if (scope.isBegin() && scope.node.exports)
                prefixes = [...prefixes, ...prefixes.map((p) => [...scope.myId, ...p])];
            else
                prefixes = prefixes.map((p) => [...scope.myId, ...p]);
            scope = scope.getParentScope();
        }
        if (prefixes.length === 0)
            return [[]];
        else
            return prefixes;
    }
    resolveSymbol(s, idPrefixes) {
        if (!s)
            return null;
        const myPrefixes = this.getPrefixes();
        const prefix = myPrefixes.find(p1 => idPrefixes.some(p2 => qualIdEqual(p1, p2)));
        if (prefix) {
            s.assumedPrefix = [];
            s.id = [...prefix, ...s.id];
            return s;
        }
        else
            return null;
        // const fullId = resolveQualId([...prefixes, s.id[s.id.length-1]], [...s.assumedPrefix, ...s.id]);
        // if(fullId) {
        //   s.assumedPrefix = [];
        //   s.id = fullId;
        //   return s;
        // } else
        //   return null
    }
    resolveId(id, idPrefixes, flags) {
        return this.resolveSymbol(this.lookupHere(id, flags), idPrefixes);
    }
    // public lookup(id: QualId, flags: ScopeFlags) : SymbolInformation<S>|null {
    //   let scope : ScopeDeclaration<S> = this;
    //   const results: SymbolInformation<S>[] = [];
    //   const flagStack : ScopeFlags[] = [];
    //   while(scope) {
    //     const result = scope.lookupHere(id,flags);
    //     if(result) {
    //       results.push(result);
    //       scope = scope.getParentScope();
    //     }
    //     // Only check the internals of the first declaration
    //     flags &= ~ScopeFlags.Private;
    //     if(scope.isEnd()) {
    //       flagStack.push(flags);
    //       flags &= ~ScopeFlags.Local;
    //     } else if(scope.isBegin() && flagStack.length > 0)
    //       flags = flagStack.pop();
    //     scope = scope.getPreviousSentence();
    //   }
    //   return null;
    // }
    lookup(id, flags) {
        let idPrefixes = this.getPrefixes();
        let results = [];
        let scope = this;
        const flagStack = [];
        while (scope) {
            const result = scope.resolveId(id, idPrefixes, flags);
            if (result)
                results.push(result);
            // Only check the internals of the first declaration
            flags &= ~ScopeFlags.Private;
            if (scope.isEnd()) {
                flagStack.push(flags);
                flags &= ~ScopeFlags.Local;
            }
            else if (scope.isBegin() && flagStack.length > 0)
                flags = flagStack.pop();
            scope = scope.getPreviousSentence();
        }
        return results;
    }
}
exports.ScopeDeclaration = ScopeDeclaration;
var parseAstSymbols;
(function (parseAstSymbols) {
    function identToSymbol(ident, kind, pos) {
        return {
            identifier: ident.text,
            kind: kind,
            range: textUtil.rangeTranslateRelative(pos, parser.locationRangeToRange(ident.loc))
        };
    }
    function definition(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [], null);
        result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Definition, pos));
        return result;
    }
    parseAstSymbols.definition = definition;
    function inductive(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [], null);
        ast.bodies.forEach(body => {
            result.addExportSymbol(identToSymbol(body.ident, SymbolKind.Inductive, pos));
            body.constructors.forEach(c => {
                result.addExportSymbol(identToSymbol(c.ident, SymbolKind.Constructor, pos));
            });
        });
        return result;
    }
    parseAstSymbols.inductive = inductive;
    function ltacDef(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [], null);
        result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Ltac, pos));
        return result;
    }
    parseAstSymbols.ltacDef = ltacDef;
    function assumptions(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [], null);
        ast.assumptions.forEach(a => {
            result.addLocalSymbol(identToSymbol(a, SymbolKind.Assumption, pos));
        });
        return result;
    }
    parseAstSymbols.assumptions = assumptions;
    function section(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [], { kind: "begin", name: ast.ident.text, exports: true });
        return result;
    }
    parseAstSymbols.section = section;
    function module(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [ast.ident.text], { kind: "begin", name: ast.ident.text, exports: ast.intro === "Export" });
        result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Module, pos));
        //  [ ast.ident, ...Array.prototype.concat(...ast.bindings.map((b) => b.idents)) ]
        //   .map((id) => identToSymbol(id, vscode.SymbolKind.Module, pos))
        return result;
    }
    parseAstSymbols.module = module;
    function moduleType(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [ast.ident.text], { kind: "begin", name: ast.ident.text, exports: false });
        result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Module, pos));
        return result;
        // return [ ast.ident, ...Array.prototype.concat(...ast.bindings.map((b) => b.idents)) ]
        //   .map((id) => identToSymbol(id, vscode.SymbolKind.Module, pos))
    }
    parseAstSymbols.moduleType = moduleType;
    function moduleBind(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [], null);
        result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Module, pos));
        return result;
    }
    parseAstSymbols.moduleBind = moduleBind;
    function moduleTypeBind(ast, sent, pos) {
        const result = new ScopeDeclaration(sent, [], null);
        result.addExportSymbol(identToSymbol(ast.ident, SymbolKind.Module, pos));
        return result;
    }
    parseAstSymbols.moduleTypeBind = moduleTypeBind;
})(parseAstSymbols || (parseAstSymbols = {}));
function parseAstForScopeDeclarations(ast, sent, pos) {
    try {
        switch (ast.type) {
            case "assumptions": return parseAstSymbols.assumptions(ast, sent, pos);
            case "definition": return parseAstSymbols.definition(ast, sent, pos);
            case "inductive": return parseAstSymbols.inductive(ast, sent, pos);
            case "ltacdef": return parseAstSymbols.ltacDef(ast, sent, pos);
            case "section": return parseAstSymbols.section(ast, sent, pos);
            case "module": return parseAstSymbols.module(ast, sent, pos);
            case "module-bind": return parseAstSymbols.moduleBind(ast, sent, pos);
            case "module-type": return parseAstSymbols.moduleType(ast, sent, pos);
            case "module-type-bind": return parseAstSymbols.moduleTypeBind(ast, sent, pos);
            default:
                return new ScopeDeclaration(sent, [], null);
        }
    }
    catch (err) {
        // debugger;
        return new ScopeDeclaration(sent, [], null);
    }
}
exports.parseAstForScopeDeclarations = parseAstForScopeDeclarations;
//# sourceMappingURL=Scopes.js.map