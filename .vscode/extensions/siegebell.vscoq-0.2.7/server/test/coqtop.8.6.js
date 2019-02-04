"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
// The module 'assert' provides assertion methods from node
const assert = require('assert');
const os = require('os');
const process = require('process');
const path = require('path');
const fs = require('fs');
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const text = require('../src/util/AnnotatedText');
const coqProto = require('../src/coqtop/coq-proto');
const coqtop_1 = require('../src/coqtop/coqtop');
const COQBIN_8_6 = process.env.COQBIN_8_6 || 'C:/Coq_trunk_build/bin';
class TraceConsole {
    constructor() {
        this.state = {
            log: new Array(),
            warn: new Array(),
            error: new Array(),
            info: new Array(),
        };
    }
    log(s) { this.state.log.push(s); }
    warn(s) { this.state.warn.push(s); }
    error(s) { this.state.error.push(s); }
    info(s) { this.state.info.push(s); }
}
function coqtopBin() {
    return path.join(COQBIN_8_6, '/coqtop');
}
// Defines a Mocha test suite to group tests of similar kind together
describe("Coqtop 8.6", function () {
    before("check if coqtop exists", function () {
        if (!fs.existsSync(path.join(COQBIN_8_6, '/coqtop')) && (os.platform() !== 'win32' || !fs.existsSync(path.join(COQBIN_8_6, '/coqtop.exe')))) {
            console.warn("Cannot find coqtop: " + coqtopBin());
            console.warn("Please make sure you have set env-var COQBIN_8_6 to point to the binaries directory of Coq 8.6.");
            this.skip();
        }
    });
    it("version", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const version = yield coqtop_1.CoqTop.detectVersion(coqtopBin(), "./", dummyConsole);
            assert(version.startsWith("8.6"), "Coqtop does not appear to be version 8.5.\nPlease make sure you have set env-var COQBIN_8_5 to point to the binaries directory of Coq 8.5.");
            const knownVersions = ["8.6.0"];
            const isKnownVersion = knownVersions.some((v) => v === version);
            if (!isKnownVersion)
                console.warn("Detected version of coqtop is not one of: " + knownVersions.join(', '));
        });
    });
    const settings = {
        binPath: COQBIN_8_6,
        autoUseWrapper: false,
        wrapper: "",
        args: [],
        traceXmlProtocol: false,
    };
    let dummyConsole = {
        log: (s) => { },
        info: (s) => { },
        warn: (s) => { },
        error: (s) => { },
    };
    let coq;
    let feedback;
    let messages;
    let isClosed;
    describe("Initialization", function () {
        this.timeout(5000);
        beforeEach("setup coqtop", function () {
            feedback = [];
            messages = [];
            isClosed = false;
            coq = new coqtop_1.CoqTop(settings, "test.v", "./", dummyConsole, {
                onFeedback: (x1) => feedback.push(x1),
                onMessage: (x1) => messages.push(x1),
                onClosed: (error) => isClosed = true,
            });
        });
        it("Init & Quit", function () {
            return __awaiter(this, void 0, void 0, function* () {
                const result = yield coq.resetCoq();
                assert.equal(result.stateId, 1);
                yield coq.coqQuit();
            });
        });
    });
    describe("Commands", function () {
        let rootState;
        beforeEach("setup coqtop", function () {
            return __awaiter(this, void 0, void 0, function* () {
                feedback = [];
                messages = [];
                isClosed = false;
                coq = new coqtop_1.CoqTop(settings, "test.v", "./", dummyConsole, {
                    onFeedback: (x1) => feedback.push(x1),
                    onMessage: (x1) => messages.push(x1),
                    onClosed: (error) => isClosed = true,
                });
                rootState = (yield coq.resetCoq()).stateId;
            });
        });
        afterEach("quit coqtop", function () {
            return __awaiter(this, void 0, void 0, function* () {
                yield coq.coqQuit();
            });
        });
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        it("Add", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let currentState = rootState;
                const result = yield coq.coqAddCommand("Check nat.", 1, currentState, true);
                currentState = result.stateId;
                assert.equal(currentState, 2);
            });
        });
        it("Add 'Check', Goal", function () {
            return __awaiter(this, void 0, void 0, function* () {
                let currentState = rootState;
                const result = yield coq.coqAddCommand("Check nat.", 1, currentState, true);
                currentState = result.stateId;
                assert.equal(currentState, 2);
                const goals = yield coq.coqGoal();
                assert.equal(goals.mode, "no-proof");
                const notice = messages.find((x) => x.level === coqProto.MessageLevel.Notice);
                notice.message = text.normalizeText(notice.message);
                assert.deepStrictEqual(notice, {
                    level: coqProto.MessageLevel.Notice,
                    location: null,
                    message: { scope: "_", text: [{ scope: "constr.reference", text: 'nat' }, '\n     : ', { scope: "constr.type", text: 'Set' }] },
                });
            });
        });
    });
});
//# sourceMappingURL=coqtop.8.6.js.map