"use strict";
const diff = require('diff');
var protocol_1 = require('../protocol');
exports.HypothesisDifference = protocol_1.HypothesisDifference;
function isScopedText(text) {
    return text && text.hasOwnProperty('scope');
}
exports.isScopedText = isScopedText;
function isTextAnnotation(text) {
    return text && typeof text.text === 'string' && !text.hasOwnProperty('scope');
}
exports.isTextAnnotation = isTextAnnotation;
function textToString(text) {
    if (typeof text === 'string') {
        return text;
    }
    else if (text instanceof Array) {
        return text.map(textToString).join('');
    }
    else if (isScopedText(text)) {
        return textToString(text.text);
    }
    else {
        return textToString(text.text);
    }
}
exports.textToString = textToString;
function textToDisplayString(text) {
    if (typeof text === 'string') {
        return text;
    }
    else if (text instanceof Array) {
        return text.map(textToDisplayString).join('');
    }
    else if (isScopedText(text)) {
        return textToDisplayString(text.text);
    }
    else if (text.substitution) {
        return textToDisplayString(text.substitution);
    }
    else {
        return text.substitution ? text.substitution : text.text;
    }
}
exports.textToDisplayString = textToDisplayString;
function textLength(text) {
    if (typeof text === 'string') {
        return text.length;
    }
    else if (text instanceof Array) {
        return text.reduce((c, t) => c + textLength(t), 0);
    }
    else if (isScopedText(text)) {
        return textLength(text.text);
    }
    else {
        return text.text.length;
    }
}
exports.textLength = textLength;
function textDisplayLength(text) {
    if (typeof text === 'string') {
        return text.length;
    }
    else if (text instanceof Array) {
        return text.reduce((c, t) => c + textDisplayLength(t), 0);
    }
    else if (isScopedText(text)) {
        return textDisplayLength(text.text);
    }
    else {
        return text.substitution ? text.substitution.length : text.text.length;
    }
}
exports.textDisplayLength = textDisplayLength;
function copyAnnotation(x) {
    if (x.diff !== undefined && x.substitution !== undefined)
        return { diff: x.diff, substitution: x.substitution };
    if (x.diff !== undefined)
        return { diff: x.diff };
    if (x.substitution !== undefined)
        return { substitution: x.substitution };
    else
        return {};
}
exports.copyAnnotation = copyAnnotation;
/**
 * Splits the text into parts separated by `separator`.
 */
function textSplit(text, separator, limit) {
    if (typeof text === 'string') {
        const result = text.split(separator).filter((v) => v !== "");
        return { splits: result.slice(0, limit), rest: limit === undefined ? [] : result.slice(limit) };
    }
    else if (text instanceof Array) {
        const splits = [];
        let idx = 0;
        let rest = [];
        let count = 0;
        for (; (limit === undefined || count < limit) && idx < text.length; ++idx) {
            const { splits: splits2, rest: rest2 } = textSplit(text[idx], separator, limit === undefined ? undefined : limit - count);
            splits.push(...splits2);
            count += splits2.length;
            rest = rest2;
        }
        if (limit === undefined)
            return { splits: splits, rest: [] };
        else {
            if (rest instanceof Array)
                return { splits: splits.slice(0, limit), rest: [...splits.slice(limit), ...rest, ...text.slice(idx)] };
            else
                return { splits: splits.slice(0, limit), rest: [...splits.slice(limit), rest, ...text.slice(idx)] };
        }
    }
    else if (isScopedText(text)) {
        const { splits: splits, rest: rest } = textSplit(text.text, separator, limit);
        const splitsResult = splits.map((s) => text.attributes ? { scope: text.scope, attributes: text.attributes, text: s } : { scope: text.scope, text: s });
        const restResult = { scope: text.scope, text: rest };
        if (text.attributes)
            restResult.attributes = text.attributes;
        return { splits: splitsResult, rest: restResult };
    }
    else {
        const result = text.text.split(separator).filter((v) => v !== "");
        return {
            splits: result.slice(0, limit).map((s) => normalizeTextAnnotationOrString({ diff: text.diff, substitution: text.substitution, text: s })),
            rest: limit === undefined ? [] :
                result.slice(limit).map((s) => normalizeTextAnnotationOrString({ diff: text.diff, substitution: text.substitution, text: s })) };
    }
}
exports.textSplit = textSplit;
function subtextHelper(text, pos, start, end) {
    if (typeof text === 'string') {
        const t = text;
        const s = t.substring(start - pos, end === undefined ? undefined : end - pos);
        return { result: s, length: s.length, next: pos + t.length };
    }
    else if (text instanceof Array) {
        const strs = [];
        let rest = [];
        let len = 0;
        for (let idx = 0; idx < text.length && (end === undefined || pos < end); ++idx) {
            const s = subtextHelper(text[idx], pos, start, end);
            if (s.length > 0) {
                if (s.result instanceof Array)
                    strs.push(...s.result);
                else
                    strs.push(s.result);
            }
            len += s.length;
            pos = s.next;
        }
        return { result: strs, length: len, next: pos };
    }
    else if (isScopedText(text)) {
        const s = subtextHelper(text.text, pos, start, end);
        return { result: { scope: text.scope, attributes: text.attributes, text: s.result }, length: s.length, next: s.next };
    }
    else {
        const t = text;
        const s = t.text.substring(start - pos, end === undefined ? undefined : end - pos);
        return { result: { diff: t.diff, substitution: t.substitution, text: s }, length: s.length, next: pos + s.length };
    }
}
function subtext(text, start, end) {
    const s = subtextHelper(text, 0, start, end);
    return normalizeText(s.result);
}
exports.subtext = subtext;
function subtextCount(text, start, count) {
    const s = subtextHelper(text, 0, start, start + count);
    return normalizeText(s.result);
}
exports.subtextCount = subtextCount;
function mapAnnotationInternal(text, map, currentOffset, currentDisplayOffset) {
    if (typeof text === 'string') {
        const result = map(text, {}, currentOffset, currentDisplayOffset);
        return { text: result, endOffset: currentOffset + textLength(result), endDisplayOffset: currentDisplayOffset + textDisplayLength(result) };
    }
    else if (text instanceof Array) {
        const results = [];
        for (let txt of text) {
            const newText = mapAnnotationInternal(txt, map, currentOffset, currentDisplayOffset);
            currentOffset = newText.endOffset;
            currentDisplayOffset = newText.endDisplayOffset;
            if (newText.text instanceof Array)
                results.push(...newText.text);
            else
                results.push(newText.text);
        }
        return { text: results, endOffset: currentOffset, endDisplayOffset: currentDisplayOffset };
    }
    else if (isScopedText(text)) {
        const result = mapAnnotationInternal(text.text, map, currentOffset, currentDisplayOffset);
        const resultText = { scope: text.scope, text: result.text };
        if (text.attributes)
            resultText.attributes = text.attributes;
        return { text: resultText, endOffset: result.endOffset, endDisplayOffset: result.endDisplayOffset };
    }
    else {
        const newText = map(text.text, copyAnnotation(text), currentOffset, currentDisplayOffset);
        return { text: newText, endOffset: currentOffset + textLength(newText), endDisplayOffset: currentDisplayOffset + textDisplayLength(newText) };
    }
}
function mapAnnotation(text, map) {
    return mapAnnotationInternal(text, map, 0, 0).text;
}
exports.mapAnnotation = mapAnnotation;
/**
 * Substitutions are compatible if either:
 * 1) neither has a substitution or
 * 2) both have substitutions and one will be substituted with ""
 */
function compatibleAnnotations(ann1, ann2) {
    return ann1.diff === ann2.diff && ((ann1.substitution === undefined && ann2.substitution === undefined) || (ann1.substitution === "" || ann2.substitution === ""));
}
exports.compatibleAnnotations = compatibleAnnotations;
function concatText(text1, text2) {
    if (typeof text1 === 'string' && typeof text2 === 'string')
        return [text1 + text2];
    else if (text1 instanceof Array)
        return text1.concat(text2);
    else if (text2 instanceof Array)
        return [text1, ...text2];
    else
        return [text1, text2];
}
function tryCombineText(text1, text2) {
    if (typeof text1 === 'string' && typeof text2 === 'string')
        return text1 + text2;
    else if (text1 === '')
        return text2;
    else if (text2 === '')
        return text1;
    else if (isScopedText(text1) && isScopedText(text2) && text1.scope === text2.scope && text1.attributes === text2.attributes) {
        if (text1.attributes)
            return { scope: text1.scope, attributes: text1.attributes, text: normalizeText(concatText(text1.text, text2.text)) };
        else
            return { scope: text1.scope, text: normalizeText(concatText(text1.text, text2.text)) };
    }
    else if (isTextAnnotation(text1) && isTextAnnotation(text2) && compatibleAnnotations(text1, text2)) {
        return normalizeTextAnnotationOrString({ diff: text1.diff, substitution: text1.substitution || text2.substitution, text: text1.text + text2.text });
    }
    else
        return undefined;
}
exports.tryCombineText = tryCombineText;
function normalizeTextAnnotationOrString(text) {
    if (typeof text === 'string') {
        return text;
    }
    else {
        let count = 0;
        for (let key in text) {
            if (text.hasOwnProperty(key) && text[key] !== undefined)
                ++count;
        }
        for (let key in text) {
            if (text.hasOwnProperty(key) && text[key] === undefined)
                delete text[key];
        }
        if (count > 1)
            return text;
        else
            return text.text;
    }
}
exports.normalizeTextAnnotationOrString = normalizeTextAnnotationOrString;
function normalizeText(text) {
    if (typeof text === 'string') {
        return text;
    }
    else if (text instanceof Array) {
        if (text.length === 0)
            return "";
        const results = [];
        const norm = normalizeText(text[0]);
        if (norm instanceof Array)
            results.push(...norm);
        else
            results.push(norm);
        for (let idx = 1; idx < text.length; ++idx) {
            const norm = normalizeText(text[idx]);
            if (norm instanceof Array) {
                if (norm.length === 0)
                    continue;
                let first = norm.shift();
                const merge = tryCombineText(results[results.length - 1], first);
                if (merge)
                    results[results.length - 1] = merge;
                else
                    results.push(merge);
                results.push(...norm);
            }
            else {
                const merge = tryCombineText(results[results.length - 1], norm);
                if (merge)
                    results[results.length - 1] = merge;
                else
                    results.push(norm);
            }
        }
        if (results.length === 1)
            return results[0];
        else
            return results;
    }
    else if (isScopedText(text)) {
        const norm = normalizeText(text.text);
        if (text.scope === "" || norm === "")
            return norm;
        else if (text.attributes && Object.keys(text.attributes).length > 0)
            return { scope: text.scope, attributes: text.attributes, text: norm };
        else
            return { scope: text.scope, text: norm };
    }
    else {
        let count = 0;
        for (let key in text) {
            if (text.hasOwnProperty(key) && text[key] !== undefined)
                ++count;
            else if (text.hasOwnProperty(key) && text[key] === undefined)
                delete text[key];
        }
        if (count > 1)
            return text;
        else
            return text.text;
    }
}
exports.normalizeText = normalizeText;
function combineAnnotationText(text, baseAnn) {
    let result;
    if (typeof text === 'string')
        result = Object.assign(copyAnnotation(baseAnn), { text: text });
    else
        result = Object.assign(copyAnnotation(baseAnn), text);
    return normalizeTextAnnotationOrString(result);
}
exports.combineAnnotationText = combineAnnotationText;
function toDiff(d, mode) {
    if (mode === "new" && d.added)
        return "added";
    else if (mode === "old" && d.removed)
        return "removed";
    else
        return undefined;
}
/**
 * @param mode - whether `text` is the old or new string
 */
function annotateDiffAdded(text, differences, options) {
    let idx = 0; // the current diff
    let offset = 0; // position of current diff w.r.t. textToString() (not textToDisplayString())
    let diffOffset = 0; // the offset into the current diff; used when a diff spans multiple text parts
    // we're only interested in unchanged parts and either added(mode="new") or removed(mode="old") parts 
    if (options.mode === "new")
        differences = differences.filter((d) => !d.removed);
    else
        differences = differences.filter((d) => !d.added);
    const result = mapAnnotation(text, (plainText, annotation, startOffset, startDisplayOffset) => {
        let text;
        let start;
        let doSubst = false;
        if (options.diffSubstitutions)
            start = startDisplayOffset;
        else
            start = startOffset;
        if (annotation.substitution && options.diffSubstitutions) {
            text = annotation.substitution;
            doSubst = true;
        }
        else
            text = plainText;
        if (offset + diffOffset != start)
            throw "invalid diff: does not line up with text position";
        const parts = [];
        for (; idx < differences.length && offset + differences[idx].value.length <= start + text.length; ++idx) {
            const diff = differences[idx];
            if (doSubst) {
                parts.push(combineAnnotationText({ text: plainText,
                    substitution: diff.value.substr(diffOffset),
                    diff: toDiff(diff, options.mode)
                }, annotation));
                plainText = ""; // remaining parts will have empty text
            }
            else
                parts.push(combineAnnotationText({ text: diff.value.substr(diffOffset), diff: toDiff(diff, options.mode) }, annotation));
            offset += diff.value.length;
            // In case we are breaking a substitution into multiple parts,
            // we only want the first part to apply the full substitution;
            // the rest will be substituted with the empty string
            if (annotation.substitution)
                annotation.substitution = "";
            diffOffset = 0;
        }
        // The diff spans this text and the next; add the *this* part
        if (idx < differences.length && offset < start + text.length) {
            // ASSUME: offset+differences[idx].value.length > start+text.length
            // I.E. ASSUME: current-diff-end extends beyond text
            if (doSubst) {
                parts.push(combineAnnotationText({ text: plainText,
                    substitution: text.substring(offset + diffOffset - start),
                    diff: toDiff(differences[idx], options.mode)
                }, annotation));
            }
            else
                parts.push(combineAnnotationText({ text: text.substring(offset + diffOffset - start), diff: toDiff(differences[idx], options.mode) }, annotation));
            // NOTE: do not advance idx or offset, but advance diffOffset
            diffOffset += text.length + start - offset - diffOffset;
        }
        // The diffs *should* be 
        if (idx > differences.length && offset < start + text.length)
            throw "invalid diff: does not line up with text length";
        if (parts.length === 0)
            return "";
        else if (parts.length === 1)
            return parts[0];
        else
            return parts;
    });
    return result;
}
exports.annotateDiffAdded = annotateDiffAdded;
function diffText(oldText, newText, normalize = true) {
    if (!oldText)
        return { text: newText, different: false };
    const difference = diff.diffWords(textToDisplayString(oldText), textToDisplayString(newText));
    const result = annotateDiffAdded(newText, difference, { diffSubstitutions: true, mode: "new" });
    if (normalize)
        return { text: normalizeText(result), different: difference.length > 1 };
    else
        return { text: result, different: difference.length > 1 };
}
exports.diffText = diffText;
function append(...texts) {
    const results = [];
    for (let txt of texts) {
        if (txt instanceof Array)
            results.push(...txt);
        else
            results.push(txt);
    }
    if (results.length === 0)
        return "";
    else if (results.length === 1)
        return results[0];
    else
        return results;
}
exports.append = append;
//# sourceMappingURL=AnnotatedText.js.map