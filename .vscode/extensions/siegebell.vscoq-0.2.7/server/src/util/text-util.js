'use strict';
const vscode_languageserver_1 = require('vscode-languageserver');
// 'sticky' flag is not yet supported :()
const lineEndingRE = /([^\r\n]*)(\r\n|\r|\n)?/;
function positionIsEqual(pos1, pos2) {
    return pos1.line === pos2.line && pos1.character === pos2.character;
}
exports.positionIsEqual = positionIsEqual;
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
    return !positionIsBefore(pos, range.start) && positionIsBefore(pos, range.end);
}
exports.rangeContains = rangeContains;
function rangeContainsOrTouches(range, pos) {
    return !positionIsBeforeOrEqual(pos, range.start) && positionIsBeforeOrEqual(pos, range.end);
}
exports.rangeContainsOrTouches = rangeContainsOrTouches;
function rangeIntersects(range1, range2) {
    return rangeContains(range1, range2.start) || rangeContains(range1, range2.end);
}
exports.rangeIntersects = rangeIntersects;
function rangeTouches(range1, range2) {
    return rangeContainsOrTouches(range1, range2.start) || rangeContainsOrTouches(range1, range2.end);
}
exports.rangeTouches = rangeTouches;
function rangeToString(r) {
    return `${r.start.line}:${r.start.character}-${r.end.line}:${r.end.character}`;
}
exports.rangeToString = rangeToString;
// enum PositionComparison {
//   Before   = 0,
//   Equal    = 1,
//   After    = 2,
// }
// export function comparePositions(pos1: Position, pos2: Position) : PositionComparison {
//   if(pos1.line < pos2.line)
//     return PositionComparison.Before;
//   else if(pos1.line > pos2.line)
//     return PositionComparison.After;
//   else if(pos1.character < pos2.character)
//     return PositionComparison.Before;
//   else if(pos1.character > pos2.character)
//     return PositionComparison.After;
//   else
//     return PositionComparison.Equal;
//   }
// enum PositionRangeIntersection {
//   Before   = 1 << 0, // 001
//   Within   = 1 << 1, // 010
//   After    = 1 << 2, // 100
//   AtStart  = 3,      // 011 
//   AtEnd    = 1 << 1, // 10
// }
// export function positionRangeIntersection(pos: Position, range: Range) : PositionRangeIntersection {
//   switch(comparePositions(pos,range.start)) {
//     case PositionComparison.Before:
//       return PositionRangeIntersection.Before;
//     case PositionComparison.Equal:
//     case PositionComparison.After:
//       // pos.line >= range.end.line
//       if(pos.line > range.end.line || pos.character > range.end.character)
//         return PositionRangeIntersection.After;
//       else
//         return PositionRangeIntersection.Within;
//   }
// }
// enum EndPositionRangeIntersection {
//   EndBefore  = 1,
//   EndAfter   = 2,
//   EndWithin  = 3,
// }
// export function endPositionRangeIntersection(pos: Position, range: Range) : EndPositionRangeIntersection {
//   switch(comparePositions(pos,range.start)) {
//     case PositionComparison.Before:
//     case PositionComparison.Equal:
//       return EndPositionRangeIntersection.EndBefore;
//     case PositionComparison.After:
//       // pos.line >= range.end.line
//       if(pos.line > range.end.line || pos.character > range.end.character)
//         return EndPositionRangeIntersection.EndAfter;
//       else
//         return EndPositionRangeIntersection.EndWithin;
//   }
// }
// enum RangeIntersection {
//   StartBefore = PositionRangeIntersection.Before,        // 1      = 0001
//   StartAfter  = PositionRangeIntersection.After,         // 2      = 0010
//   StartWithin = PositionRangeIntersection.Within,        // 3      = 0011
//   EndBefore   = EndPositionRangeIntersection.EndBefore,  // 1 << 2 = 0100
//   EndAfter    = EndPositionRangeIntersection.EndAfter,   // 2 << 2 = 1000
//   EndWithin   = EndPositionRangeIntersection.EndWithin,  // 3 << 2 = 1100
//   /** Ex: [++++  ----] or [++++----] */
//   Before = StartBefore | EndBefore,
//   /** Ex: [+++**---] */
//   OverlapBefore = StartBefore | EndWithin,
//   /** Ex: [+++***] or [+++***+++] or [***+++] */
//   Contains,
//   /** Ex: [****] */
//   Equal,
//   /** Ex: [---***] or [---***] or [---***---] */
//   Within,
//   /** Ex: [---**+++] */
//   OverlapAfter,
//   /** Ex: [----  ++++] or [----++++] */
//   After
// }
// export function rangeIntersection(range1: Range, range2: Range) : RangeIntersection {
//   let result = <number>comparePositions(range1.start,range2.start) | (<number>comparePositions(range1.start,range2.start)) << 3;
//   if(result & RangeIntersection.StartLT || result & RangeIntersection.StartEq)
//     result|= RangeIntersection.StartLE;
//   else if(result & RangeIntersection.StartGT || result & RangeIntersection.StartEq)
//     result|= RangeIntersection.StartGE;
//   if(result & RangeIntersection.EndLT || result & RangeIntersection.StartEq)
//     result|= RangeIntersection.StartLE;
//   else if(result & RangeIntersection.StartGT || result & RangeIntersection.StartEq)
//     result|= RangeIntersection.StartGE;
//   return result;
// }
/** Calculates the offset into text of pos, where textStart is the position where text starts and both pos and textStart are absolute positions
 * @return the offset into text indicated by pos, or -1 if pos is out of range
 *
 * 'abc\ndef'
 * 'acbX\ndef'
 * +++*** --> +++_***
 * */
function relativeOffsetAtAbsolutePosition(text, textStart, pos) {
    let line = textStart.line;
    let currentOffset = 0;
    // count the relative lines and offset w.r.t text
    while (line < pos.line) {
        const match = lineEndingRE.exec(text.substring(currentOffset));
        ++line; // there was a new line
        currentOffset += match[0].length;
    }
    if (line > pos.line)
        return -1;
    else if (textStart.line === pos.line)
        return Math.max(-1, pos.character - textStart.character);
    else
        return Math.max(-1, pos.character + currentOffset);
}
exports.relativeOffsetAtAbsolutePosition = relativeOffsetAtAbsolutePosition;
function offsetAt(text, pos) {
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
exports.offsetAt = offsetAt;
/**
 * @returns the Position (line, column) for the location (character position), assuming that text begins at start
 */
function positionAtRelative(start, text, offset) {
    if (offset > text.length)
        offset = text.length;
    let line = start.line;
    let currentOffset = 0; // offset into text we are current at; <= `offset`
    let lineOffset = start.character;
    let lastIndex = start.character;
    while (true) {
        const match = lineEndingRE.exec(text.substring(currentOffset));
        // match[0] -- characters plus newline
        // match[1] -- characters up to newline
        // match[2] -- newline (\n, \r, or \r\n)
        if (!match || match[0].length === 0 || currentOffset + match[1].length >= offset)
            return vscode_languageserver_1.Position.create(line, lineOffset + Math.max(offset - currentOffset, 0));
        currentOffset += match[0].length;
        lineOffset = 0;
        ++line;
    }
}
exports.positionAtRelative = positionAtRelative;
/**
 * @returns the Position (line, column) for the location (character position), assuming that text begins at start.
 *
 * @param offset -- counts all newlines (e.g. '\r\n') as *one character*
 */
function positionAtRelativeCNL(start, text, offset) {
    if (offset > text.length) {
        return positionAtRelative(start, text, text.length);
    }
    let line = start.line;
    let currentOffset = 0; // offset into text we are current at; <= `offset`
    let lineOffset = start.character;
    let lastIndex = start.character;
    while (true) {
        const match = lineEndingRE.exec(text.substring(currentOffset));
        // match[0] -- characters plus newline
        // match[1] -- characters up to newline
        // match[2] -- newline (\n, \r, or \r\n)
        if (!match || match[0].length === 0 || match[1].length >= offset)
            return vscode_languageserver_1.Position.create(line, lineOffset + offset);
        currentOffset += match[0].length;
        offset -= match[1].length + (match[2] === undefined ? 0 : 1);
        lineOffset = 0;
        ++line;
    }
}
exports.positionAtRelativeCNL = positionAtRelativeCNL;
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
            return vscode_languageserver_1.Position.create(line, Math.max(offset - lastIndex, 0));
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
        return vscode_languageserver_1.Position.create(pos.line + delta.linesDelta, x);
    }
    else
        return vscode_languageserver_1.Position.create(pos.line + delta.linesDelta, pos.character);
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
        return vscode_languageserver_1.Position.create(pos.line + delta.linesDelta, x);
    }
    else
        return vscode_languageserver_1.Position.create(pos.line + delta.linesDelta, pos.character);
}
exports.positionRangeDeltaTranslateEnd = positionRangeDeltaTranslateEnd;
function rangeDeltaTranslate(range, delta) {
    return vscode_languageserver_1.Range.create(positionRangeDeltaTranslate(range.start, delta), positionRangeDeltaTranslateEnd(range.end, delta));
}
exports.rangeDeltaTranslate = rangeDeltaTranslate;
/** Sums the two positions. In effect, gets the absolute position of `relPos`.
 * @param absPos -- position at which `relPos` is relative to
 * @param relPos -- a relative position
 */
function positionTranslateRelative(absPos, relPos) {
    if (relPos.line === 0)
        return vscode_languageserver_1.Position.create(absPos.line, absPos.character + relPos.character);
    else
        return vscode_languageserver_1.Position.create(absPos.line + relPos.line, relPos.character);
}
exports.positionTranslateRelative = positionTranslateRelative;
/** Converts `relRange` from a relative range w.r.t. `absPos` to an absolute range.
 * @param absPos -- position at which `relRange` is relative to
 * @param relRange -- a range, relative to absPos
 */
function rangeTranslateRelative(absPos, relRange) {
    return vscode_languageserver_1.Range.create(positionTranslateRelative(absPos, relRange.start), positionTranslateRelative(absPos, relRange.end));
}
exports.rangeTranslateRelative = rangeTranslateRelative;
//# sourceMappingURL=text-util.js.map