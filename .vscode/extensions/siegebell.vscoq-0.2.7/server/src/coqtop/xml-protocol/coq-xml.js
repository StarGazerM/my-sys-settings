'use strict';
const events = require('events');
const sax = require('sax');
function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
exports.escapeXml = escapeXml;
class XmlStream extends events.EventEmitter {
    constructor(inputStream, deserializer, callbacks) {
        super();
        this.inputStream = inputStream;
        this.deserializer = deserializer;
        this.stack = [];
        this.annotateTextMode = false;
        this.textStack = [];
        if (callbacks) {
            if (callbacks.onValue)
                this.on('response: value', (x) => callbacks.onValue(x));
            if (callbacks.onFeedback)
                this.on('response: feedback', (x) => callbacks.onFeedback(x));
            if (callbacks.onMessage)
                this.on('response: message', (x) => callbacks.onMessage(x));
            if (callbacks.onOther)
                this.on('response', (tag, x) => callbacks.onOther(tag, x));
            if (callbacks.onError)
                this.on('error', (x) => callbacks.onError(x));
        }
        let options = {
            lowercase: true,
            trim: false,
            normalize: false,
            xmlns: false,
            position: false,
            strictEntities: false,
            noscript: true
        };
        let saxStream = sax.createStream(false, options);
        saxStream.on('error', (err) => this.onError(err));
        saxStream.on('opentag', (node) => this.onOpenTag(node));
        saxStream.on('closetag', (tagName) => this.onCloseTag(tagName));
        saxStream.on('text', (text) => this.onText(text));
        saxStream.on('end', () => this.onEnd());
        saxStream.write('<coqtoproot>'); // write a dummy root node to satisfy the xml parser
        this.inputStream.pipe(saxStream);
    }
    onError(err) {
        this.emit('error', err);
    }
    onOpenTag(node) {
        if (node.name === 'coqtoproot')
            return;
        if (this.annotateTextMode) {
            let txt = { scope: node.name, attributes: node.attributes, text: [] };
            this.textStack.push(txt);
        }
        else if (node.name === 'richpp') {
            let txt = { scope: "", attributes: node.attributes, text: [] };
            this.annotateTextMode = true;
            this.textStack = [txt];
        }
        else {
            let topNode = {
                $name: node.name,
                $: node.attributes,
                // $text: "",
                $children: []
            };
            this.stack.push(topNode);
        }
    }
    onCloseTag(closingTagName) {
        if (closingTagName === 'coqtoproot') {
            this.emit('error', 'malformed XML input stream has too many closing tags');
            return;
        }
        if (this.annotateTextMode) {
            const current = this.textStack.pop();
            if (this.textStack.length > 0) {
                const top = this.textStack[this.textStack.length - 1];
                if (top.text instanceof Array)
                    top.text.push(current);
                else
                    top.text = [top.text, current];
                return;
            }
            else {
                let newTop = this.stack[this.stack.length - 1];
                newTop.$children.push(current);
                newTop['richpp'] = current;
                this.annotateTextMode = false;
                return;
            }
        }
        else if (this.stack.length === 0)
            return;
        else {
            let currentTop = this.stack.pop();
            let tagName = currentTop.$name;
            let value = this.deserializer.deserialize(currentTop);
            if (this.stack.length > 0) {
                let newTop = this.stack[this.stack.length - 1];
                newTop.$children.push(value);
                newTop[tagName] = value;
                if (closingTagName === 'richpp') {
                    this.annotateTextMode = false;
                }
            }
            else {
                this.emit('response', currentTop.$name, value);
                this.emit('response: ' + currentTop.$name, value);
            }
        }
    }
    onText(text) {
        if (this.annotateTextMode) {
            const top = this.textStack[this.textStack.length - 1];
            if (top.text instanceof Array)
                top.text.push(text);
            else
                top.text = [top.text, text];
        }
        else if (this.stack.length > 0) {
            this.stack[this.stack.length - 1].$children.push(text);
        }
    }
    onEnd() {
        this.emit('end');
    }
    pause() {
        this.inputStream.pause();
    }
    resume() {
        this.inputStream.resume();
    }
}
exports.XmlStream = XmlStream;
//# sourceMappingURL=coq-xml.js.map