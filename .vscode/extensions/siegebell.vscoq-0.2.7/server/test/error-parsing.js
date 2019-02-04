"use strict";
// The module 'assert' provides assertion methods from node
const assert = require('assert');
const perr = require('../src/parsing/error-parsing');
// Defines a Mocha test suite to group tests of similar kind together
describe("error-parsing", () => {
    function parse(err) {
        return { err: err, perr: perr.parseError(err) };
    }
    it("parseError", (() => {
        const x0 = parse("Impossible to unify an expression with an expression");
        assert.equal(x0.err, x0.perr);
        const x1 = parse("Impossible to unify an expression with an Expression");
        assert.deepStrictEqual(x1.perr, ["Impossible to unify an ", { diff: "removed", text: "e" }, "xpression with an ", { diff: "added", text: "E" }, "xpression"]);
        const x2 = parse("Impossible to unify an expression with an xpression");
        assert.deepStrictEqual(x2.perr, ["Impossible to unify an ", { diff: "removed", text: "e" }, "xpression with an xpression"]);
        const x3 = parse('Error: Unable to unify "True" with "False".');
        assert.deepStrictEqual(x3.perr, ['Error: Unable to unify "', { diff: "removed", text: "Tru" }, 'e" with "', { diff: "added", text: "Fals" }, 'e".']);
        const x4 = parse('\nError:\nThe term ""a"" has type "string"\nwhile it is expected to have type\n"bool".');
        assert.deepStrictEqual(x4.perr, ['\nError:\nThe term ""a"" has type "', { diff: "removed", text: "string" }, '"\nwhile it is expected to have type\n"', { diff: "added", text: "bool" }, '".']);
        const x5 = parse('The file ident.vo contains library dirpath and not library dirpath’');
        assert.deepStrictEqual(x5.perr, ['The file ident.vo contains library dirpath and not library dirpath', { diff: "added", text: "’" }]);
        const x6 = parse('Error:  Found target  class "foo" instead  of "Foo".');
        assert.deepStrictEqual(x6.perr, ['Error:  Found target  class "', { diff: "removed", text: "f" }, 'oo" instead  of "', { diff: "added", text: "F" }, 'oo".']);
        const x7 = parse('Error: Refiner was given an argument "asdf234 3 5r ()23 " of type foo instead of fOO.');
        assert.deepStrictEqual(x7.perr, ['Error: Refiner was given an argument "asdf234 3 5r ()23 " of type f', { diff: "removed", text: "oo" }, ' instead of f', { diff: "added", text: "OO" }, '.']);
    }));
});
//# sourceMappingURL=error-parsing.js.map