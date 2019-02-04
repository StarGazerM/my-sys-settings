"use strict";
const AnnotatedText_1 = require('./AnnotatedText');
const server = require('../server');
function regexpOptionalGroup(re) {
    if (re)
        return `(?:${re})`;
    else
        return "";
}
class PrettifySymbolsMode {
    constructor(substitutions) {
        if (!substitutions || substitutions.length === 0) {
            this.regex = null;
            return;
        }
        const uglyAllStrings = [];
        for (let prettySubst of substitutions) {
            const uglyStr = regexpOptionalGroup(prettySubst.pre) + "(" + prettySubst.ugly + ")" + regexpOptionalGroup(prettySubst.post);
            try {
                const uglyRegEx = new RegExp(uglyStr); // test the regex
                uglyAllStrings.push(`(?:${uglyStr})`);
            }
            catch (e) {
                server.connection.console.warn(`Could not add rule "${uglyStr}" --> "${prettySubst.pretty}"; invalid regular expression`);
            }
        }
        this.regex = new RegExp(uglyAllStrings.join('|'), 'g');
        this.substs = substitutions.map((s) => s.pretty);
    }
    getMatchSubst(match, text) {
        const matches = match
            .map((value, idx) => ({ index: idx, match: value }))
            .filter((value) => value.match !== undefined);
        if (matches.length <= 1)
            return undefined;
        const matchIdx = matches[matches.length - 1].index;
        const matchStr = match[matchIdx];
        const start = match.index + match[0].indexOf(matchStr);
        const end = start + matchStr.length;
        // continue the search at the end of the ugly bit; not the whole match
        this.regex.lastIndex = end;
        return { start: start, pretty: this.substs[matchIdx - 1], ugly: matchStr };
    }
    prettifyString(text, baseAnn) {
        let newText = [];
        this.regex.lastIndex = 0;
        let currentIdx = 0;
        let match;
        while (match = this.regex.exec(text)) {
            if (match[0].length === 0)
                return text;
            try {
                const subst = this.getMatchSubst(match, text);
                if (subst && currentIdx === subst.start)
                    newText.push(AnnotatedText_1.combineAnnotationText({ substitution: subst.pretty, text: subst.ugly }, baseAnn));
                else if (subst)
                    newText.push(AnnotatedText_1.combineAnnotationText(text.substring(currentIdx, subst.start), baseAnn), AnnotatedText_1.combineAnnotationText({ substitution: subst.pretty, text: subst.ugly }, baseAnn));
                else
                    newText.push(AnnotatedText_1.combineAnnotationText(match[0], baseAnn));
            }
            catch (e) {
                newText.push(AnnotatedText_1.combineAnnotationText(match[0], baseAnn));
            }
            currentIdx = this.regex.lastIndex;
        }
        // add the rest of the text (no substitutions found)
        if (currentIdx < text.length)
            newText.push(text.substring(currentIdx));
        return newText;
    }
    prettify(text) {
        if (!this.regex)
            return text;
        return AnnotatedText_1.mapAnnotation(text, (plainText, ann, start, displayStart) => {
            return this.prettifyString(plainText, ann);
        });
    }
}
exports.PrettifySymbolsMode = PrettifySymbolsMode;
//# sourceMappingURL=PrettifySymbols.js.map