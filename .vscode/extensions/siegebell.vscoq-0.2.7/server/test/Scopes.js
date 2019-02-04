"use strict";
// The module 'assert' provides assertion methods from node
const assert = require('assert');
const vscode = require('vscode-languageserver');
const scopes = require('../src/sentence-model/Scopes');
const Scopes_1 = require('../src/sentence-model/Scopes');
class MockSentence {
    constructor(prev, next, scope) {
        this.prev = prev;
        this.next = next;
        this.scope = scope;
    }
    getScope() { return this.scope; }
}
class ScopeDeclaration extends scopes.ScopeDeclaration {
}
describe("Scopes", function () {
    let currentPos;
    beforeEach(function () {
        currentPos = vscode.Position.create(0, 0);
    });
    function nextPos(p) {
        if (!p)
            p = currentPos;
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);
        currentPos = vscode.Position.create(p.line + x, p.character + y);
        return currentPos;
    }
    function nextRange(r) {
        if (!r)
            r = currentPos;
        const s = nextPos(vscode.Range.is(r) ? r.end : r);
        const e = nextPos(s);
        return vscode.Range.create(s, e);
    }
    // before("check if coqtop exists", function() {
    //   if(!fs.existsSync(path.join(COQBIN_8_6, '/coqtop')) && (os.platform()!=='win32' || !fs.existsSync(path.join(COQBIN_8_6, '/coqtop.exe')))) {
    //     console.warn("Cannot find coqtop: " + path.join(COQBIN_8_6, '/coqtop'));
    //     console.warn("Please make sure you have set env-var COQBIN_8_6 to point to the binaries directory of Coq 8.6.");
    //     this.skip();
    //   }
    // })
    describe('helpers', function () {
        it('resolveQualId', function () {
            assert.deepStrictEqual(scopes.resolveQualId([], []), []);
            assert.deepStrictEqual(scopes.resolveQualId([], ['a']), null);
            assert.deepStrictEqual(scopes.resolveQualId(['a'], ['a']), ['a']);
            assert.deepStrictEqual(scopes.resolveQualId(['a'], ['b', 'a']), null);
            assert.deepStrictEqual(scopes.resolveQualId(['a2'], []), ['a2']);
            assert.deepStrictEqual(scopes.resolveQualId(['a2', 'b'], []), ['a2', 'b']);
            assert.deepStrictEqual(scopes.resolveQualId(['b', 'a'], ['a']), ['b', 'a']);
            assert.deepStrictEqual(scopes.resolveQualId(['a', 'b'], ['a', 'b']), ['a', 'b']);
            assert.deepStrictEqual(scopes.resolveQualId(['a', 'b'], ['a', 'c']), null);
            assert.deepStrictEqual(scopes.resolveQualId(['a', 'b'], ['c']), null);
        });
        it('matchQualId', function () {
            assert.deepStrictEqual(scopes.matchQualId([], []), { which: 0, prefix: [], id: [] });
            assert.deepStrictEqual(scopes.matchQualId([], ['a']), { which: 0, prefix: ['a'], id: [] });
            assert.deepStrictEqual(scopes.matchQualId(['a'], ['a']), { which: 0, prefix: [], id: ['a'] });
            assert.deepStrictEqual(scopes.matchQualId(['a'], ['b', 'a']), { which: 0, prefix: ['b'], id: ['a'] });
            assert.deepStrictEqual(scopes.matchQualId(['a'], []), { which: 1, prefix: ['a'], id: [] });
            assert.deepStrictEqual(scopes.matchQualId(['b', 'a'], ['a']), { which: 1, prefix: ['b'], id: ['a'] });
            assert.deepStrictEqual(scopes.matchQualId(['c', 'b', 'a'], ['a']), { which: 1, prefix: ['c', 'b'], id: ['a'] });
            assert.deepStrictEqual(scopes.matchQualId(['c', 'b', 'a'], ['b', 'a']), { which: 1, prefix: ['c'], id: ['b', 'a'] });
            assert.deepStrictEqual(scopes.matchQualId(['a', 'b'], ['a', 'b']), { which: 0, prefix: [], id: ['a', 'b'] });
            assert.deepStrictEqual(scopes.matchQualId(['a', 'b'], ['a', 'c']), null);
            assert.deepStrictEqual(scopes.matchQualId(['a', 'b'], ['c', 'b']), null);
            assert.deepStrictEqual(scopes.matchQualId(['a', 'b'], ['c']), null);
        });
        it('ScopeFlags', function () {
            assert.equal(Scopes_1.ScopeFlags.All & Scopes_1.ScopeFlags.Local, Scopes_1.ScopeFlags.Local);
            assert.equal(Scopes_1.ScopeFlags.All & Scopes_1.ScopeFlags.Private, Scopes_1.ScopeFlags.Private);
            assert.equal(Scopes_1.ScopeFlags.All & Scopes_1.ScopeFlags.Export, Scopes_1.ScopeFlags.Export);
            assert.equal(Scopes_1.ScopeFlags.Local & Scopes_1.ScopeFlags.Private, false);
            assert.equal(Scopes_1.ScopeFlags.Local & Scopes_1.ScopeFlags.Export, false);
            assert.equal(Scopes_1.ScopeFlags.Private & Scopes_1.ScopeFlags.Export, false);
        });
    });
    describe.skip('single-scope', function () {
        let s;
        let symb;
        beforeEach(function () {
            symb = {
                foo: { identifier: 'foo', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
                bar: { identifier: 'bar', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
                aaa: { identifier: 'aaa', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
                bbb: { identifier: 'bbb', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
                ccc: { identifier: 'ccc', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
            };
            s = new MockSentence(null, null, null);
        });
        it("constructor1", function () {
            s.scope = new ScopeDeclaration(s, [], null);
            assert.equal(s.scope.lookup([], Scopes_1.ScopeFlags.All), null);
            assert.equal(s.scope.lookup(['foo'], Scopes_1.ScopeFlags.All), null);
            assert.equal(s.scope.lookup(['M', 'foo'], Scopes_1.ScopeFlags.All), null);
            assert.equal(s.scope.isBegin(), false);
            assert.equal(s.scope.isEnd(), false);
            assert.deepStrictEqual(s.scope.getPrefixes(), []);
            assert.deepStrictEqual(s.scope.getNextSentence(), null);
            assert.deepStrictEqual(s.scope.getPreviousSentence(), null);
            assert.deepStrictEqual(s.scope.getParentScope(), null);
        });
        it("constructor2", function () {
            s.scope = new ScopeDeclaration(s, ['M'], null);
            assert.equal(s.scope.lookup([], Scopes_1.ScopeFlags.All), null);
            assert.equal(s.scope.lookup(['foo'], Scopes_1.ScopeFlags.All), null);
            assert.equal(s.scope.lookup(['M', 'foo'], Scopes_1.ScopeFlags.All), null);
            assert.equal(s.scope.isBegin(), false);
            assert.equal(s.scope.isEnd(), false);
            assert.deepStrictEqual(s.scope.getPrefixes(), []);
        });
        it("isBegin", function () {
            s.scope = new ScopeDeclaration(s, ['M'], { kind: "begin", name: "MOO", exports: true });
            assert.equal(s.scope.isBegin('M'), false);
            assert.equal(s.scope.isBegin('MOO'), true);
            assert.equal(s.scope.isEnd('MOO'), false);
            assert.equal(s.scope.isEnd('M'), false);
            assert.equal(s.scope.isEnd(), false);
        });
        it("isEnd", function () {
            s.scope = new ScopeDeclaration(s, ['M'], { kind: "end", name: "MOO" });
            assert.equal(s.scope.isBegin('M'), false);
            assert.equal(s.scope.isBegin('MOO'), false);
            assert.equal(s.scope.isEnd('MOO'), true);
            assert.equal(s.scope.isEnd('M'), false);
            assert.equal(s.scope.isEnd(), true);
        });
        function assertSymbolLookup(si, sy, p) {
            assert.notEqual(si, null);
            si.forEach((si, idx) => assert.equal(si.symbol, sy[idx]));
            si.forEach((si, idx) => assert.deepStrictEqual(si.source, s));
            si.forEach((si, idx) => assert.deepStrictEqual(si.id, [...p, sy[idx].identifier]));
            si.forEach((si, idx) => assert.deepStrictEqual(si.assumedPrefix, []));
        }
        it("lookupSymbolInList", function () {
            s.scope = new ScopeDeclaration(s, ['M'], null);
            assertSymbolLookup([s.scope.lookupSymbolInList(['foo'], [symb.foo])], [symb.foo], []);
            assertSymbolLookup([s.scope.lookupSymbolInList(['bar'], [symb.foo, symb.bar, symb.aaa])], [symb.bar], []);
            assert.deepStrictEqual(s.scope.lookupSymbolInList(['bar'], []), null);
        });
        it("lookupHere", function () {
            s.scope = new ScopeDeclaration(s, ['M'], null);
            s.scope.addExportSymbol(symb.foo);
            assert.equal(s.scope.lookupHere(['bar'], Scopes_1.ScopeFlags.All), null);
            assert.equal(s.scope.lookupHere(['foo'], Scopes_1.ScopeFlags.Local), null);
            assert.equal(s.scope.lookupHere(['foo'], Scopes_1.ScopeFlags.Private), null);
            assertSymbolLookup([s.scope.lookupHere(['foo'], Scopes_1.ScopeFlags.All)], [symb.foo], []);
            assertSymbolLookup([s.scope.lookupHere(['foo'], Scopes_1.ScopeFlags.Export)], [symb.foo], []);
        });
        it("resolveSymbol", function () {
            s.scope = new ScopeDeclaration(s, ['M'], null);
            assert.equal(s.scope.resolveSymbol(null), null);
            s.scope.addExportSymbol(symb.foo);
            assert.equal(s.scope.resolveSymbol(null), null);
            const si1 = {
                assumedPrefix: [],
                id: ['foo'],
                source: s,
                symbol: symb.foo,
            };
            assert.notEqual(s.scope.resolveSymbol(si1), null);
            assert.deepStrictEqual(s.scope.resolveSymbol(si1).assumedPrefix, []);
            assert.deepStrictEqual(s.scope.resolveSymbol(si1).id, ['foo']);
            assert.equal(s.scope.resolveSymbol(si1).source, s);
            assert.equal(s.scope.resolveSymbol(si1).symbol, symb.foo);
            const si2 = { assumedPrefix: ['M0'], id: ['foo'], source: s, symbol: symb.foo };
            assert.deepStrictEqual(s.scope.resolveSymbol(si2), null);
            const si3 = { assumedPrefix: ['M2'], id: ['foo'], source: s, symbol: symb.foo };
            assert.deepStrictEqual(s.scope.resolveSymbol(si3), null);
            s.scope.getPrefixes = function () {
                return [['M1', 'M2']];
            };
            assert.deepStrictEqual(s.scope.resolveSymbol(si1).assumedPrefix, []);
            assert.deepStrictEqual(s.scope.resolveSymbol(si1).id, ['M1', 'M2', 'foo']);
            assert.deepStrictEqual(s.scope.resolveSymbol(si2), null);
            assert.notEqual(s.scope.resolveSymbol(si3), null);
            assert.deepStrictEqual(s.scope.resolveSymbol(si3).id, ['M1', 'M2', 'foo']);
            assert.deepStrictEqual(s.scope.resolveSymbol(si3).assumedPrefix, []);
        });
        it("lookup", function () {
            s.scope = new ScopeDeclaration(s, ['M'], null);
            s.scope.addExportSymbol(symb.foo);
            assertSymbolLookup(s.scope.lookup(['foo'], Scopes_1.ScopeFlags.All), symb.foo, []);
            assert.equal(s.scope.lookup(['bar'], Scopes_1.ScopeFlags.All), null);
        });
    });
    describe('multi-scope', function () {
        let s;
        let symb;
        function addScope(create, ...args) {
            const i = s.push(new MockSentence(null, null, null)) - 1;
            s[i].scope = create(s[i], ...args);
            if (i > 0) {
                s[i - 1].next = s[i];
                s[i].prev = s[i - 1];
            }
        }
        beforeEach(function () {
            symb = {
                foo: { identifier: 'foo', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
                bar: { identifier: 'bar', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
                aaa: { identifier: 'aaa', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
                bbb: { identifier: 'bbb', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
                ccc: { identifier: 'ccc', range: nextRange(), kind: Scopes_1.SymbolKind.Definition },
            };
            s = [];
            addScope(ScopeDeclaration.createDefinition, 'foo', nextRange());
            addScope(ScopeDeclaration.createSection, 'A', nextRange());
            addScope(ScopeDeclaration.createDefinition, 'bar', nextRange());
            addScope(ScopeDeclaration.createEnd, 'A');
            addScope(ScopeDeclaration.createModule, 'M', nextRange());
            addScope(ScopeDeclaration.createDefinition, 'foo', nextRange());
            addScope(ScopeDeclaration.createDefinition, 'bar', nextRange());
            addScope(ScopeDeclaration.createEnd, 'M');
            addScope(ScopeDeclaration.createDefinition, 'bar', nextRange());
        });
        function assertSymbolLookup(idx, si, sy, p) {
            assert.notEqual(si, null);
            assert.equal(si.symbol, sy);
            assert.deepStrictEqual(si.source, s[idx]);
            assert.deepStrictEqual(si.id, [...p, sy.identifier]);
            assert.deepStrictEqual(si.assumedPrefix, []);
        }
        it("getPreviousSentence", function () {
            assert.deepStrictEqual(s[0].scope.getPreviousSentence(), null);
            for (let idx = 1; idx < s.length; ++idx)
                assert.deepStrictEqual(s[idx].scope.getPreviousSentence(), s[idx - 1].scope);
        });
        it("getNextSentence", function () {
            for (let idx = 0; idx < s.length - 1; ++idx)
                assert.deepStrictEqual(s[idx].scope.getNextSentence(), s[idx + 1].scope);
            assert.deepStrictEqual(s[s.length - 1].scope.getNextSentence(), null);
        });
        it("getParentScope", function () {
            function testGetParentScope(tests) {
                tests.forEach(([idx, expected]) => assert.deepStrictEqual(s[idx].scope.getParentScope(), expected === null ? null : s[expected].scope, `s[${idx}].getParent() === ${expected === null ? 'null' : `s[${expected.toString()}].scope`}`));
            }
            testGetParentScope([
                [0, null],
                [1, null],
                [2, 1],
                [3, 1],
                [4, null],
                [5, 4],
                [6, 4],
                [7, 4],
                [8, null],
            ]);
        });
        it.skip("getPrefix", function () {
            function testGetPrefix(tests) {
                tests.forEach(([idx, expected]) => assert.deepStrictEqual(s[idx].scope.getPrefixes(), expected, `s[${idx}].prefix === ${expected.toString()}`));
            }
            testGetPrefix([
                [0, []],
                [1, []],
                [2, []],
                [3, []],
                [4, []],
                [5, ['M']],
                [6, ['M']],
                [7, ['M']],
                [8, []],
            ]);
        });
        it.skip("lookup", function () {
            function testLookup(tests) {
                tests.forEach(([idx, id, f, expectedSource, expectedId]) => {
                    const x = s[idx].scope.lookup(id, f);
                    x.forEach((x, idx) => {
                        assert.deepStrictEqual(x.source, s[expectedSource[idx]], `s[${idx}].lookup(${id.toString()}).source === s[${expectedSource[idx].toString()}]`);
                        assert.deepStrictEqual(x.id, expectedId[idx], `s[${idx}].lookup(${id.toString()}).id === ${expectedId[idx].toString()}`);
                    });
                });
            }
            testLookup([
                [0, ['foo'], Scopes_1.ScopeFlags.All, [0], [['foo']]],
                [8, ['bar'], Scopes_1.ScopeFlags.All, [8], [['bar']]],
                [8, ['foo'], Scopes_1.ScopeFlags.All, [5], [['M', 'foo']]],
                [8, ['M', 'foo'], Scopes_1.ScopeFlags.All, [5], [['M', 'foo']]],
                [8, ['foo'], Scopes_1.ScopeFlags.All, [0], [['foo']]],
            ]);
        });
    });
});
//# sourceMappingURL=Scopes.js.map