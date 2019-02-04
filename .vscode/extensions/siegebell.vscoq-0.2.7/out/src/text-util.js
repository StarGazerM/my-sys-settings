'use strict';
const vscode_1 = require('vscode');
// 'sticky' flag is not yet supported :()
const lineEndingRE = /([^\r\n]*)(\r\n|\r|\n)?/;
const formatTimSpanNumber = new Intl.NumberFormat(undefined, { useGrouping: false, minimumIntegerDigits: 2, maximumFractionDigits: 0 });
function formatTimeSpanMS(durationMS) {
    const days = Math.floor(durationMS / 1000 / 60 / 60 / 24);
    const hours = Math.floor(durationMS / 1000 / 60 / 60) - days * 24;
    const minutes = Math.floor(durationMS / 1000 / 60) - hours * 60;
    const seconds = Math.floor(durationMS / 1000) - minutes * 60;
    if (days > 0)
        return `${days}.${formatTimSpanNumber.format(hours)}:${formatTimSpanNumber.format(minutes)}:${formatTimSpanNumber.format(seconds)}`;
    else
        return `${hours}:${formatTimSpanNumber.format(minutes)}:${formatTimSpanNumber.format(seconds)}`;
    // else if(hours > 0)
    //   return `${hours}:${formatTimSpanNumber.format(minutes)}:${formatTimSpanNumber.format(seconds)}`;
    // else if(minutes > 0)
    //   return `${minutes}:${formatTimSpanNumber.format(seconds)}`;
    // else
    //   return `${seconds}`;
}
exports.formatTimeSpanMS = formatTimeSpanMS;
function positionIsBefore(pos1, pos2) {
    return (pos1.line < pos2.line || (pos1.line === pos2.line && pos1.character < pos2.character));
}
exports.positionIsBefore = positionIsBefore;
function positionIsBeforeOrEqual(pos1, pos2) {
    return (pos1.line < pos2.line || (pos1.line === pos2.line && pos1.character <= pos2.character));
}
exports.positionIsBeforeOrEqual = positionIsBeforeOrEqual;
function positionIsAfter(pos1, pos2) {
    return (pos1.line > pos2.line || (pos1.line === pos2.line && pos1.character > pos2.character));
}
exports.positionIsAfter = positionIsAfter;
function positionIsAfterOrEqual(pos1, pos2) {
    return (pos1.line > pos2.line || (pos1.line === pos2.line && pos1.character >= pos2.character));
}
exports.positionIsAfterOrEqual = positionIsAfterOrEqual;
function rangeContains(range, pos) {
    return !this.positionIsBefore(pos, range.start) && this.positionIsBefore(pos, range.end);
}
exports.rangeContains = rangeContains;
function rangeContainsOrTouches(range, pos) {
    return !this.positionIsBeforeOrEqual(pos, range.start) && this.positionIsBeforeOrEqual(pos, range.end);
}
exports.rangeContainsOrTouches = rangeContainsOrTouches;
function rangeIntersects(range1, range2) {
    return this.rangeContains(range1, range2.start) || this.rangeContains(range1, range2.end);
}
exports.rangeIntersects = rangeIntersects;
function rangeTouches(range1, range2) {
    return this.rangeContainsOrTouches(range1, range2.start) || this.rangeContainsOrTouches(range1, range2.end);
}
exports.rangeTouches = rangeTouches;
function locationAt(text, pos) {
    let line = pos.line;
    let lastIndex = 0;
    while (line > 0) {
        const match = lineEndingRE.exec(text.substring(lastIndex));
        if (match[2] === '' || match[2] === undefined)
            return -1; // the position is beyond the length of text
        else {
            lastIndex += match[0].length;
            --line;
        }
    }
    return lastIndex + pos.character;
}
exports.locationAt = locationAt;
/**
 * @returns the Position (line, column) for the location (character position)
 */
function positionAt(text, offset) {
    if (offset > text.length)
        offset = text.length;
    let line = 0;
    let lastIndex = 0;
    while (true) {
        const match = lineEndingRE.exec(text.substring(lastIndex));
        if (lastIndex + match[1].length >= offset)
            return new vscode_1.Position(line, offset - lastIndex);
        lastIndex += match[0].length;
        ++line;
    }
}
exports.positionAt = positionAt;
/**
 * @returns the lines and characters represented by the text
 */
function toRangeDelta(oldRange, text) {
    const newEnd = positionAt(text, text.length);
    let charsDelta;
    if (oldRange.start.line === oldRange.end.line)
        charsDelta = newEnd.character - (oldRange.end.character - oldRange.start.character);
    else
        charsDelta = newEnd.character - oldRange.end.character;
    return {
        start: oldRange.start,
        end: oldRange.end,
        linesDelta: newEnd.line - (oldRange.end.line - oldRange.start.line),
        charactersDelta: charsDelta
    };
}
exports.toRangeDelta = toRangeDelta;
function positionRangeDeltaTranslate(pos, delta) {
    if (positionIsBefore(pos, delta.end))
        return pos;
    else if (delta.end.line === pos.line) {
        let x = pos.character + delta.charactersDelta;
        if (delta.linesDelta > 0)
            x = x - delta.end.character;
        else if (delta.start.line === delta.end.line + delta.linesDelta && delta.linesDelta < 0)
            x = x + delta.start.character;
        return new vscode_1.Position(pos.line + delta.linesDelta, x);
    }
    else
        return new vscode_1.Position(pos.line + delta.linesDelta, pos.character);
}
exports.positionRangeDeltaTranslate = positionRangeDeltaTranslate;
function positionRangeDeltaTranslateEnd(pos, delta) {
    if (positionIsBeforeOrEqual(pos, delta.end))
        return pos;
    else if (delta.end.line === pos.line) {
        let x = pos.character + delta.charactersDelta;
        if (delta.linesDelta > 0)
            x = x - delta.end.character;
        else if (delta.start.line === delta.end.line + delta.linesDelta && delta.linesDelta < 0)
            x = x + delta.start.character;
        return new vscode_1.Position(pos.line + delta.linesDelta, x);
    }
    else
        return new vscode_1.Position(pos.line + delta.linesDelta, pos.character);
}
exports.positionRangeDeltaTranslateEnd = positionRangeDeltaTranslateEnd;
function rangeTranslate(range, delta) {
    return new vscode_1.Range(positionRangeDeltaTranslate(range.start, delta), positionRangeDeltaTranslateEnd(range.end, delta));
}
exports.rangeTranslate = rangeTranslate;
//# sourceMappingURL=text-util.js.map