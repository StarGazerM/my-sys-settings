"use strict";
const textUtil = require('../util/text-util');
const vscode_languageserver_1 = require('vscode-languageserver');
const vscode = require('vscode-languageserver');
const Sentence_1 = require('./Sentence');
const parser = require('../parsing/coq-parser');
const server = require('../server');
const util = require('util');
const Scopes_1 = require('./Scopes');
class SentenceCollection {
    constructor(document) {
        this.sentences = [];
        this.sentencesInvalidatedCallbacks = new Set();
        this.languageId = 'coq';
        this.lineCount = 0;
        this.currentError = null;
        this.uri = document.uri;
        this.version = document.version;
        this.documentText = document.text;
        this.lineCount = textUtil.positionAt(document.text, document.text.length - 1).line;
        try {
            this.reparseSentences(0);
        }
        catch (err) {
            server.connection.console.error(err);
        }
    }
    applyChangesToDocumentText(sortedChanges) {
        for (const change of sortedChanges) {
            const beginOffset = textUtil.offsetAt(this.documentText, change.range.start);
            this.documentText =
                this.documentText.substring(0, beginOffset)
                    + change.text
                    + this.documentText.substring(beginOffset + change.rangeLength);
            const delta = textUtil.toRangeDelta(change.range, change.text);
            this.lineCount += delta.linesDelta;
        }
    }
    getText() {
        return this.documentText;
    }
    getSentenceLine(pos) {
        const sent = this.getSentenceAt(pos);
        if (sent)
            return sent.getLine(pos);
        else
            return null;
    }
    getLine(line) {
        const lineRE = /.*/g;
        const offset = this.offsetAt(vscode_languageserver_1.Position.create(line, 0));
        lineRE.lastIndex = offset;
        const match = lineRE.exec(this.documentText);
        if (match) {
            return {
                text: match[0],
                range: vscode_languageserver_1.Range.create(this.positionAt(match.index), this.positionAt(match.index + match[0].length)),
                offset: match.index,
            };
        }
        else
            return null;
    }
    getDefinitionAt(pos) {
        const line = this.getLine(pos.line);
        if (!line)
            return null;
        const identRE = /[a-zA-Z_][a-z-A-Z0-9_']*(?:[.][a-zA-Z_][a-z-A-Z0-9_']*)*/g;
        identRE.lastIndex = 0;
        let match;
        while (match = identRE.exec(line.text)) {
            if (match.index <= pos.character && pos.character <= match.index + match[0].length) {
                console.log("qualid: " + match[0]);
                const start = textUtil.positionAtRelative(line.range.start, line.text, match.index);
                const end = textUtil.positionAtRelative(line.range.start, line.text, match.index + match[0].length);
                return {
                    id: match[0].split('.'),
                    range: vscode_languageserver_1.Range.create(start, end),
                    offset: line.offset + match.index,
                };
            }
        }
        return null;
    }
    lookupDefinition(pos) {
        const def = this.getDefinitionAt(pos);
        if (!def)
            return [];
        const sent = this.getSentenceIndexBeforeOrAt(pos);
        if (sent < 0)
            return [];
        return this.sentences[sent].getScope().lookup(def.id, Scopes_1.ScopeFlags.All);
    }
    positionAt(offset) {
        for (let sent of this.sentences) {
            const sentOffset = sent.getDocumentOffset();
            const sentEndOffset = sent.getDocumentEndOffset();
            if (sentOffset <= offset && offset < sentEndOffset) {
                return sent.positionAt(offset - sentOffset);
            }
        }
        // Can't find the offset in a sentence, so calculate the position from the whole document
        return textUtil.positionAt(this.documentText, offset);
    }
    offsetAt(position) {
        const sentIdx = this.getSentenceIndexBeforeOrAt(position);
        if (sentIdx < 0 || this.sentences[sentIdx].isBefore(position))
            return textUtil.offsetAt(this.documentText, position);
        else
            return this.sentences[sentIdx].documentOffsetAt(position);
    }
    onSentencesInvalidated(handler) {
        this.sentencesInvalidatedCallbacks.add(handler);
        return { dispose: () => {
                this.sentencesInvalidatedCallbacks.delete(handler);
            } };
    }
    /**
     * @returns the index of the closest sentence containing or appearing before `pos`, or `-1` if no sentence is before or contains `pos`.
     */
    getSentenceIndexBeforeOrAt(pos) {
        let sentIdx = 0;
        while (sentIdx < this.sentences.length && this.sentences[sentIdx].isBeforeOrAt(pos))
            ++sentIdx;
        if (sentIdx >= this.sentences.length)
            return -1;
        else
            return sentIdx - 1;
    }
    /**
     * @returns the index of the closest sentence containing or appearing after `pos`, or `this.sentences.length` if no sentence is after or contains `pos`.
     */
    getSentenceIndexAfterOrAt(pos) {
        if (this.sentences.length === 0)
            return 0;
        let sentIdx = this.sentences.length - 1;
        while (sentIdx >= 0 && this.sentences[sentIdx].isAfterOrAt(pos))
            --sentIdx;
        return sentIdx + 1;
    }
    /**
     * Applies text changes to the sentences; adjusting ranges and possibly invalidating sentences.
     * Invalidated sentences will be automatically reparsed.
     */
    applyTextChanges(newVersion, changes) {
        this.currentError = null;
        // sort the edits such that later edits are processed first
        let sortedChanges = changes.sort((change1, change2) => textUtil.positionIsAfter(change1.range.start, change2.range.start) ? -1 : 1);
        this.applyChangesToDocumentText(changes);
        const invalidatedSentences = [];
        for (let change of changes) {
            if (textUtil.positionIsAfter(change.range.end, this.getLastPosition())) {
                invalidatedSentences.push(this.sentences.length);
                break;
            }
        }
        const deltas = sortedChanges.map((c) => textUtil.toRangeDelta(c.range, c.text));
        for (let sentIdx = this.sentences.length - 1; sentIdx >= 0; --sentIdx) {
            const sent = this.sentences[sentIdx];
            const preserved = sent.applyTextChanges(sortedChanges, deltas, this.documentText);
            if (!preserved) {
                invalidatedSentences.push(sentIdx);
            }
        }
        this.version = newVersion;
        try {
            const removed = this.reparseSentencesByIndices(invalidatedSentences);
            this.sentencesInvalidatedCallbacks.forEach((handler) => handler(removed.removed));
        }
        catch (err) {
            server.connection.console.warn("Error reparsing sentences: " + err.toString());
        }
    }
    *getErrors() {
        if (this.currentError)
            yield this.currentError;
    }
    getSentencePosition(sentenceIndex) {
        if (this.sentences.length === 0) {
            return vscode_languageserver_1.Position.create(0, 0);
        }
        else if (sentenceIndex < this.sentences.length) {
            return this.sentences[sentenceIndex].getRange().start;
        }
        else {
            return this.sentences[this.sentences.length - 1].getRange().end;
        }
    }
    getSentenceOffset(sentenceIndex) {
        if (this.sentences.length === 0) {
            return 0;
        }
        else if (sentenceIndex < this.sentences.length) {
            return this.sentences[sentenceIndex].getDocumentOffset();
        }
        else {
            return this.sentences[this.sentences.length - 1].getDocumentEndOffset();
        }
    }
    getLastPosition() {
        if (this.sentences.length === 0) {
            return vscode_languageserver_1.Position.create(0, 0);
        }
        else {
            return this.sentences[this.sentences.length - 1].getRange().end;
        }
    }
    getLastOffset() {
        if (this.sentences.length === 0) {
            return 0;
        }
        else {
            return this.sentences[this.sentences.length - 1].getDocumentEndOffset();
        }
    }
    getSentences() {
        return this.sentences;
    }
    getSentencePrefixTextAt(pos, normalize = true) {
        const sent = this.getSentenceIndexBeforeOrAt(pos);
        let range;
        let text;
        let prefix;
        if (sent < 0) {
            const offset = this.offsetAt(pos);
            prefix = parser.normalizeText(this.documentText.substring(0, offset));
        }
        else if (this.sentences[sent].contains(pos)) {
            range = this.sentences[sent].getRange();
            text = this.sentences[sent].getText();
            const offset = textUtil.relativeOffsetAtAbsolutePosition(text, range.start, pos);
            prefix = parser.normalizeText(text.substring(0, offset));
        }
        else if (sent + 1 < this.sentences.length) {
            const start = this.sentences[sent].getRange().end;
            const end = this.sentences[sent + 1].getRange().start;
            text = this.documentText.substring(this.offsetAt(start), this.offsetAt(end));
            const offset = textUtil.relativeOffsetAtAbsolutePosition(text, start, pos);
            prefix = parser.normalizeText(text.substring(0, offset));
        }
        else {
            const start = this.sentences[sent].getRange().end;
            text = this.documentText.substring(this.offsetAt(start));
            const offset = textUtil.relativeOffsetAtAbsolutePosition(text, start, pos);
            prefix = parser.normalizeText(text.substring(0, offset));
        }
        if (normalize)
            return parser.normalizeText(prefix);
        else
            return prefix;
    }
    /**
     * @param `pos` -- position in the text document
     * @return the sentence containing `pos`, or `null` if no such sentence exists
     */
    getSentenceAt(pos) {
        const idx = this.getSentenceIndexBeforeOrAt(pos);
        if (idx < 0)
            return null;
        if (this.sentences[idx].contains(pos))
            return this.sentences[idx];
    }
    /**
     * @param count -- minimum number of sentences to reparse
     * @return reparsed sentences
     */
    reparseSentencesByIndices(indices) {
        if (indices.length <= 0)
            return { removed: [], added: [] };
        // sort in ascending order
        indices = indices.sort();
        const removed = [];
        const added = [];
        let shift = 0;
        for (let idx = 0; idx < indices.length; ++idx) {
            const sentIdx = shift + indices[idx];
            const patch = this.reparseSentences(sentIdx);
            removed.push(...patch.removed);
            added.push(...patch.added);
            if (patch.endOfSentences)
                break;
            // skip past any indices that were reparsed in this patch
            while (idx < indices.length && shift + indices[idx] < sentIdx + patch.removed.length)
                ++idx;
            // removing & inserting parsed sentences will cause `indices` to drift w.r.t. `this.sentences`
            // this tracks the adjustments for indices past our current point
            // (but is not accurate for `< idx`)
            shift += patch.added.length - patch.removed.length;
        }
        return { removed: removed, added: added };
    }
    /**
     * @param count -- minimum number of sentences to reparse
     * @return removed sentences
     */
    reparseSentences(start, minCount = 0) {
        if (start < 0 || start > this.sentences.length)
            throw new RangeError("sentence index out of range");
        else if (minCount > this.sentences.length - start)
            minCount = this.sentences.length - start;
        let currentPosition = this.getSentencePosition(start);
        let currentOffset = this.getSentenceOffset(start);
        const reparsed = [];
        let prev = this.sentences[start - 1] || null;
        try {
            for (let idx = 0;; ++idx) {
                const parseText = this.documentText.substring(currentOffset);
                const sent = parser.parseSentence(parseText);
                if (sent.type === "EOF") {
                    const removed = this.sentences.splice(start, this.sentences.length - start, ...reparsed);
                    removed.forEach((sent) => sent.dispose());
                    return { removed: removed, added: reparsed, endOfSentences: true };
                }
                if (idx >= minCount && start + idx < this.sentences.length && currentOffset + sent.text.length === this.sentences[start + idx].getDocumentEndOffset()) {
                    // no need to parse further; keep remaining sentences
                    const removed = this.sentences.splice(start, idx, ...reparsed);
                    // adjust prev/next references among the sentences
                    if (reparsed.length > 0) {
                        const lastReparsed = reparsed[reparsed.length - 1];
                        lastReparsed.next = this.sentences[start + reparsed.length] || null;
                        if (lastReparsed.next)
                            lastReparsed.next.prev = lastReparsed;
                    }
                    else {
                        if (this.sentences[start - 1])
                            this.sentences[start - 1].next = this.sentences[start] || null;
                        if (this.sentences[start])
                            this.sentences[start].prev = this.sentences[start - 1] || null;
                    }
                    this.sentences[start + reparsed.length - 1].next = this.sentences[start + reparsed.length] || null;
                    if (start + reparsed.length < this.sentences.length)
                        this.sentences[start + reparsed.length].prev = this.sentences[start + reparsed.length - 1] || null;
                    //
                    removed.forEach((sent) => sent.dispose());
                    return { removed: removed, added: reparsed, endOfSentences: false };
                }
                const command = sent.text;
                const range = vscode_languageserver_1.Range.create(currentPosition, textUtil.positionAtRelative(currentPosition, command, sent.text.length));
                const newSent = new Sentence_1.Sentence(command, range, currentOffset, prev, sent);
                reparsed.push(newSent);
                if (prev)
                    prev.next = newSent;
                prev = newSent;
                currentPosition = range.end;
                currentOffset += sent.text.length;
            }
        }
        catch (error) {
            if (error instanceof parser.SyntaxError) {
                this.currentError = vscode.Diagnostic.create(textUtil.rangeTranslateRelative(currentPosition, error.range), error.message, 1 /* Error */, undefined, "parser");
                // end of parsable sentences
                // treat the rest of the document as unparsed
                const removed = this.sentences.splice(start, this.sentences.length - start, ...reparsed);
                removed.forEach((sent) => sent.dispose());
                return { removed: removed, added: reparsed, endOfSentences: true };
            }
            else {
                server.connection.console.warn("unknown parsing error: " + util.inspect(error, false, undefined));
                throw error;
            }
        }
    }
}
exports.SentenceCollection = SentenceCollection;
//# sourceMappingURL=SentenceCollection.js.map