"use strict";
// The module 'assert' provides assertion methods from node
const assert = require('assert');
const parser = require('../src/parsing/coq-parser');
describe("coq-parser", function () {
    function loc(start, end) {
        return {
            start: {
                offset: start,
                line: 1,
                column: start + 1
            },
            end: {
                offset: (end || start),
                line: 1,
                column: (end || start) + 1
            } };
    }
    function ident(name, start, end) {
        return { text: name, loc: loc(start, end || start + name.length) };
    }
    function inductive(bodies, text, rest) {
        return { type: 'inductive', kind: "Inductive", bodies: bodies, text: text, rest: rest };
    }
    function indBody(name, offset, binders, constructors, type = null) {
        return { ident: ident(name, offset), termType: type, binders: binders, constructors: constructors };
    }
    it('parseSentenceLength', function () {
        assert.equal(parser.parseSentenceLength('* auto.'), 1); // bug #105
        assert.equal(parser.parseSentenceLength('  * auto.'), 3); // bug #105
        assert.equal(parser.parseSentenceLength('(*c*)* auto.'), 6);
        assert.equal(parser.parseSentenceLength('   '), -1);
        assert.equal(parser.parseSentenceLength('Inductive w(k:E):=(). ('), 21);
    });
    it('parseSentence - SAny', function () {
        assert.deepStrictEqual(parser.parseSentence('Inductive w(k:E):=(). ('), { type: 'any', text: 'Inductive w(k:E):=().', rest: ' (' });
    });
    it('parseSentence - SInductive', function () {
        assert.deepStrictEqual(parser.parseSentence('Inductive w := a. ('), inductive([indBody("w", 10, [], [{ ident: ident("a", 15), binders: [], term: null }])], 'Inductive w := a.', ' ('));
        assert.deepStrictEqual(parser.parseSentence('Inductive w : Prop := a. ('), inductive([indBody("w", 10, [], [{ ident: ident("a", 22), binders: [], term: null }], "Prop")], 'Inductive w : Prop := a.', ' ('));
    });
});
//# sourceMappingURL=coq-parser.js.map