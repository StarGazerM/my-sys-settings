"use strict";
var protocol_1 = require('./protocol');
exports.HypothesisDifference = protocol_1.HypothesisDifference;
function isScopedText(text) {
    return text.hasOwnProperty('scope');
}
exports.isScopedText = isScopedText;
function isTextAnnotation(text) {
    return typeof text.text === 'string';
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
//# sourceMappingURL=AnnotatedText.js.map