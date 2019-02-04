'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const net = require('net');
const util = require('util');
const path = require('path');
const events = require('events');
// var xml2js = require('xml2js');
// import * as stream from 'stream'; 
const coqXml = require('./xml-protocol/coq-xml');
const coqProto = require('./coq-proto');
const child_process_1 = require('child_process');
const fs = require('fs');
const os = require('os');
const xmlTypes = require('./xml-protocol/CoqXmlProtocolTypes');
const AnnotatedText_1 = require('../util/AnnotatedText');
const deserialize_1 = require('./xml-protocol/deserialize');
// import entities = require('entities'); 
// const spawn = require('child_process').spawn;
// from vscode-languageserver
// export interface RemoteConsole {
//     error(message: string): any;
//     warn(message: string): any;
//     info(message: string): any;
//     log(message: string): any;
// }
/** Coqtop was interrupted; call cancelled */
class Interrupted {
    constructor(stateId) {
        this.stateId = stateId;
    }
    toString() {
        return 'Coqtop Interrupted';
    }
}
exports.Interrupted = Interrupted;
/** A fatal error of coqtop */
class CoqtopSpawnError {
    constructor(path, message) {
        this.path = path;
        this.message = message;
    }
    get binPath() {
        return this.path;
    }
    toString() {
        return "Could not start coqtop: " + this.path + (this.message ? "\n" + this.message : "");
    }
}
exports.CoqtopSpawnError = CoqtopSpawnError;
/** A call did not succeed; a nonfatal error */
class CallFailure {
    constructor(message, stateId, range) {
        this.message = message;
        this.stateId = stateId;
        this.range = range;
        this.message = AnnotatedText_1.normalizeText(this.message);
    }
    toString() {
        return AnnotatedText_1.textToDisplayString(this.message) +
            (this.range || this.stateId
                ? "  (" +
                    (this.range ? `offsets ${this.range.start}-${this.range.stop}` : (this.stateId ? " " : "")) +
                    (this.stateId ? ` of stateId ${this.stateId}` : "")
                    + ")"
                : "");
    }
}
exports.CallFailure = CallFailure;
class CoqTop extends events.EventEmitter {
    constructor(settings, scriptFile, projectRoot, console, callbacks) {
        super();
        this.coqtopProc = null;
        this.supportsInterruptCall = false;
        this.settings = settings;
        this.scriptFile = scriptFile;
        this.projectRoot = projectRoot;
        this.console = console;
        this.callbacks = callbacks;
        this.mainChannelServer = net.createServer();
        this.mainChannelServer2 = net.createServer();
        this.controlChannelServer = net.createServer();
        this.controlChannelServer2 = net.createServer();
        this.mainChannelServer.maxConnections = 1;
        this.mainChannelServer2.maxConnections = 1;
        this.controlChannelServer.maxConnections = 1;
        this.controlChannelServer2.maxConnections = 1;
        this.readyToListen = [
            this.startListening(this.mainChannelServer),
            this.startListening(this.mainChannelServer2),
            this.startListening(this.controlChannelServer),
            this.startListening(this.controlChannelServer2)
        ];
        // this.resetCoq(coqPath);
    }
    dispose() {
        if (this.coqtopProc) {
            try {
                this.coqtopProc.kill();
                if (this.coqtopProc.connected)
                    this.coqtopProc.disconnect();
            }
            catch (e) { }
            this.coqtopProc = null;
        }
        if (this.mainChannelR)
            this.mainChannelR.end();
        if (this.mainChannelW)
            this.mainChannelW.end();
        if (this.controlChannelR)
            this.controlChannelR.end();
        if (this.controlChannelW)
            this.controlChannelW.end();
        this.coqtopProc = undefined;
        this.mainChannelR = undefined;
        this.mainChannelW = undefined;
        this.controlChannelR = undefined;
        this.controlChannelW = undefined;
    }
    cleanup(error) {
        if (this.isRunning()) {
            this.dispose();
            this.callbacks.onClosed(error);
        }
        else
            this.dispose();
    }
    isRunning() {
        return this.coqtopProc != null;
    }
    checkState() {
        if (this.coqtopProc === null)
            this.resetCoq();
    }
    startListening(server) {
        const port = 0;
        const host = 'localhost';
        return new Promise((resolve, reject) => {
            server.listen({ port: port, host: host }, (err) => {
                if (err)
                    reject(err);
                else {
                    this.console.log(`Listening at ${server.address().address}:${server.address().port}`);
                    resolve();
                }
            });
        });
    }
    acceptConnection(server, name, dataHandler) {
        return new Promise((resolve) => {
            server.once('connection', (socket) => {
                this.console.log(`Client connected on ${name} (port ${socket.localPort})`);
                socket.setEncoding('utf8');
                if (dataHandler)
                    socket.on('data', (data) => dataHandler(data));
                socket.on('error', (err) => this.onCoqTopError(err.toString() + ` (${name})`));
                resolve(socket);
            });
        });
    }
    findWrapper() {
        const autoWrapper = path.join(__dirname, '../../../', 'coqtopw.exe');
        if (this.settings.wrapper && this.settings.wrapper !== "" && fs.existsSync(this.settings.wrapper))
            return this.settings.wrapper;
        else if (this.settings.autoUseWrapper && os.platform() === 'win32' && fs.existsSync(autoWrapper))
            return autoWrapper;
        else
            return null;
    }
    getVersion() {
        return this.coqtopVersion;
    }
    static detectVersion(coqtopModule, cwd, console) {
        if (console)
            console.log('exec: ' + coqtopModule + ' -v');
        return new Promise((resolve, reject) => {
            try {
                const coqtop = child_process_1.spawn(coqtopModule, ['-v'], { detached: false, cwd: cwd });
                let result = "";
                coqtop.stdout.on('data', (data) => {
                    result += data;
                });
                coqtop.on('close', (code) => {
                    const ver = /^\s*The Coq Proof Assistant, version (.+?)\s/.exec(result);
                    // if(!ver)
                    //   console.warn('Could not detect coqtop version');
                    resolve(!ver ? undefined : ver[1]);
                });
                coqtop.on('error', (code) => {
                    // console.warn(`Could not start coqtop; error code: ${code}`)
                    reject(new CoqtopSpawnError(coqtopModule, `error code: ${code}`));
                });
            }
            catch (err) {
                reject(new CoqtopSpawnError(coqtopModule, err));
            }
        });
    }
    resetCoq(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (settings)
                this.settings = settings;
            this.console.log('reset');
            this.cleanup(undefined);
            this.coqtopVersion = yield CoqTop.detectVersion(this.coqtopBin, this.projectRoot, this.console);
            if (this.coqtopVersion)
                this.console.log(`Detected coqtop version ${this.coqtopVersion}`);
            else
                this.console.warn(`Could not detect coqtop version`);
            const wrapper = this.findWrapper();
            if (wrapper !== null)
                yield this.setupCoqTop(wrapper);
            else
                yield this.setupCoqTopReadAndWritePorts();
            return yield this.coqInit();
        });
    }
    setupCoqTop(wrapper) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.readyToListen);
            var mainAddr = this.mainChannelServer.address();
            var controlAddr = this.controlChannelServer.address();
            var mainAddressArg = mainAddr.address + ':' + mainAddr.port;
            var controlAddressArg = controlAddr.address + ':' + controlAddr.port;
            try {
                const scriptUri = decodeURIComponent(this.scriptFile);
                if (wrapper !== null) {
                    const traceFile = (scriptUri.startsWith("file:///") && this.settings.traceXmlProtocol)
                        ? scriptUri.substring("file:///".length) + ".coq-trace.xml"
                        : undefined;
                    this.startCoqTop(this.spawnCoqTopWrapper(wrapper, mainAddressArg, controlAddressArg, traceFile));
                }
                else
                    this.startCoqTop(this.spawnCoqTop(mainAddressArg, controlAddressArg));
            }
            catch (error) {
                this.console.error('Could not spawn coqtop: ' + error);
                throw new CoqtopSpawnError(this.coqtopBin, error);
            }
            let channels = yield Promise.all([
                this.acceptConnection(this.mainChannelServer, 'main channel', (data) => this.onMainChannelR(data)),
                this.acceptConnection(this.controlChannelServer, 'control channel', (data) => this.onControlChannelR(data)),
            ]);
            this.mainChannelR = channels[0];
            this.mainChannelW = channels[0];
            this.controlChannelR = channels[1];
            this.controlChannelW = channels[1];
            const deserializer = deserialize_1.createDeserializer(this.coqtopVersion);
            this.parser = new coqXml.XmlStream(this.mainChannelR, deserializer, {
                onFeedback: (feedback) => this.onFeedback(feedback),
                onMessage: (msg) => this.onMessage(msg),
                onOther: (tag, x) => this.onOther(tag, x),
                onError: (x) => this.onSerializationError(x)
            });
            // this.mainChannelR.on('data', (data) => this.onMainChannelR(data));
        });
    }
    /** Start coqtop.
     * Use two ports: one for reading & one for writing; i.e. HOST:READPORT:WRITEPORT
     */
    setupCoqTopReadAndWritePorts() {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.readyToListen);
            var mainAddr = this.mainChannelServer.address();
            var mainPortW = this.mainChannelServer2.address().port;
            var controlAddr = this.controlChannelServer.address();
            var controlPortW = this.controlChannelServer2.address().port;
            var mainAddressArg = mainAddr.address + ':' + mainAddr.port + ':' + mainPortW;
            var controlAddressArg = controlAddr.address + ':' + controlAddr.port + ':' + controlPortW;
            try {
                this.startCoqTop(this.spawnCoqTop(mainAddressArg, controlAddressArg));
            }
            catch (error) {
                this.console.error('Could not spawn coqtop: ' + error);
                throw new CoqtopSpawnError(this.coqtopBin, error);
            }
            let channels = yield Promise.all([
                this.acceptConnection(this.mainChannelServer, 'main channel R', (data) => this.onMainChannelR(data)),
                this.acceptConnection(this.mainChannelServer2, 'main channel W', (data) => this.onMainChannelW(data)),
                this.acceptConnection(this.controlChannelServer, 'control channel R', (data) => this.onControlChannelR(data)),
                this.acceptConnection(this.controlChannelServer2, 'control channel W', (data) => this.onControlChannelW(data)),
            ]);
            this.mainChannelR = channels[0];
            this.mainChannelW = channels[1];
            this.controlChannelR = channels[2];
            this.controlChannelW = channels[3];
            const deserializer = deserialize_1.createDeserializer(this.coqtopVersion);
            this.parser = new coqXml.XmlStream(this.mainChannelR, deserializer, {
                onFeedback: (feedback) => this.onFeedback(feedback),
                onMessage: (msg) => this.onMessage(msg),
                onOther: (tag, x) => this.onOther(tag, x),
                onError: (x) => this.onSerializationError(x)
            });
            // this.mainChannelR.on('data', (data) => this.onMainChannelR(data));
        });
    }
    onCoqTopError(message) {
        this.console.error('Error: ' + message);
        this.cleanup(message);
    }
    startCoqTop(process) {
        this.coqtopProc = process;
        this.console.log(`coqtop started with pid ${this.coqtopProc.pid}`);
        this.coqtopProc.stdout.on('data', (data) => this.coqtopOut(data));
        this.coqtopProc.on('exit', (code) => {
            this.console.log('coqtop exited with code: ' + code);
        });
        this.coqtopProc.stderr.on('data', (data) => {
            this.console.log('coqtop-stderr: ' + data);
        });
        this.coqtopProc.on('close', (code) => {
            this.console.log('coqtop closed with code: ' + code);
            this.cleanup('coqtop closed with code: ' + code);
        });
        this.coqtopProc.on('error', (code) => {
            this.console.log('coqtop could not be started: ' + code);
            this.cleanup('coqtop could not be started: ' + code);
        });
        // this.coqtopProc.stdin.write('\n');
    }
    get coqtopBin() {
        return path.join(this.settings.binPath.trim(), 'coqtop');
    }
    spawnCoqTop(mainAddr, controlAddr) {
        var coqtopModule = this.coqtopBin;
        // var coqtopModule = 'cmd';
        var args = [
            // '/D /C', this.coqPath + '/coqtop.exe',
            '-main-channel', mainAddr,
            '-control-channel', controlAddr,
            '-ideslave',
            '-async-proofs', 'on'
        ].concat(this.settings.args);
        this.console.log('exec: ' + coqtopModule + ' ' + args.join(' '));
        return child_process_1.spawn(coqtopModule, args, { detached: false, cwd: this.projectRoot });
    }
    spawnCoqTopWrapper(wrapper, mainAddr, controlAddr, traceFile) {
        this.supportsInterruptCall = true;
        var coqtopModule = wrapper;
        var args = [
            // '/D /C', this.coqPath + '/coqtop.exe',
            '-coqtopbin', this.coqtopBin,
            '-main-channel', mainAddr,
            '-control-channel', controlAddr,
            '-ideslave',
            '-async-proofs', 'on'
        ]
            .concat(traceFile ? ['-tracefile', traceFile] : [])
            .concat(this.settings.args);
        this.console.log('exec: ' + coqtopModule + ' ' + args.join(' '));
        return child_process_1.spawn(coqtopModule, args, { detached: false, cwd: this.projectRoot });
    }
    // 
    //   private spawnCoqTop() {
    //     try {
    //       // var coqtopModule = this.coqPath + '/coqtop';
    //       var coqtopModule = 'cmd';
    //       var mainAddr = this.mainChannelServerR.address();
    //       var mainPortW = this.mainChannelServerW.address().port;
    //       var controlAddr = this.controlChannelServerR.address();
    //       var controlPortW = this.controlChannelServerW.address().port;
    //       var args = [
    //         '/D /C', this.coqPath + '/coqtop.exe',
    //         '-main-channel', mainAddr.address + ':' + mainAddr.port + ':' + mainPortW,
    //         '-control-channel', controlAddr.address + ':' + controlAddr.port + ':' + controlPortW,
    //         '-ideslave',
    //         '-async-proofs', 'on'
    //         ];
    //       this.console.log('exec: ' + coqtopModule + ' ' + args.toLocaleString());
    //       this.coqtopProc = spawn(coqtopModule, args, {detached: true});
    //       this.console.log(`coqtop started with pid ${this.coqtopProc.pid}`);
    //       // this.coqtopProc.unref();
    //       this.coqtopProc.stdout.on('data', this.coqtopOut)
    //       this.coqtopProc.on('exit', (code) => {
    //         this.console.log('coqtop exited with code: ' + code);
    //         // this.cleanup();
    //       });
    //       this.coqtopProc.stderr.on('data', (data) => {
    //         this.console.log('coqtop-stderr: ' + data);
    //       });
    //       this.coqtopProc.on('close', (code) => {
    //         this.console.log('coqtop closed with code: ' + code);
    //         this.cleanup();
    //       });
    //       this.coqtopProc.on('error', (code) => {
    //         this.console.log('coqtop could not be started: ' + code);
    //         this.cleanup();
    //       });
    //     } catch (error) {
    //       this.console.error('Could not spawn coqtop: ' + error);
    //       throw <FailureResult>{message: 'Could not spawn coqtop'};
    //     }
    //   }
    //   
    // coqParser = new xml2js.Parser({
    //   trim: true,
    //   normalizeTags: true,
    //   explicitArray: true,
    //   mergeAttrs: false
    // });
    // onValue(value: coqXml.Value) {
    //   super.emit('value', value);
    // }
    // 
    // onFeedback(feedback: any) {
    //   try {
    //     this.console.log('FEEDBACK');
    //     switch(feedback.$.object) {
    //     case 'state':
    //       feedback.feedback_content.forEach( (y) => {
    //         switch(y.$.val) {
    //           case 'workerstatus':
    //             var worker = y.pair[0].string[0];
    //             var status = y.pair[0].string[1];
    //             this.console.log('worker ' + worker + ' is ' + status);
    //             break;
    //           default:
    //             this.console.warn('unknown coqtop feedback-content-response: ' + y.$.val);
    //             this.console.log('coqtop response: ' + util.inspect(feedback, false, null));
    //         }
    //       })
    //       break;
    //     default:
    //       this.console.warn('unknown coqtop feedback-response: ' + feedback.$.object);
    //       this.console.log('coqtop response: ' + util.inspect(feedback, false, null));
    //     }
    //   } catch(err) {
    //     this.console.error("FEEDBACK ERROR: " + err + '\n  on: ' + util.inspect(feedback, false, null));
    //   }
    // }
    // onMainChannelRError(err: any) {
    //   this.console.error('XmlStream error: ' + err);
    // }
    onMainChannelR(data) {
        // this.console.log('>>' + data);
        //     try {
        //     this.coqParser.parseString(data, (err,x) => {
        //       if (err) {
        //         this.console.log('main-channelR parse error: ' + err + '\n  on:' + data);
        //         return;
        //       }
        // 
        //       // var x = { value: { '$': { val: 'good' }, state_id: [ { '$': { val: '1' } } ] } };
        //       // var x = { feedback:  { '$': { object: 'state', route: '0' }, state_id: [ { '$': { val: '1' } } ],
        //       //    feedback_content: [ { '$': { val: 'workerstatus' }, pair: [ { string: [ 'proofworker:0', 'Idle' ] } ] } ] } };
        //       // this.console.log('coqtop response: ' + util.inspect(x, false, null));
        // 
        //       if (x.value) {
        //         return;
        //       } else if(x.feedback) {
        //         return;
        //       } else {
        //         this.console.warn('unknown coqtop response: ' + util.inspect(x, false, null));
        //       }
        //     });
        //     } catch(err) {
        //       this.console.error("main-channelR XML parse error: " + err + '\n  on: ' + data);
        //     }
        // <value val="good"><state_id val="1"/></value>
    }
    onMainChannelW(data) {
        this.console.log('main-channelW: ' + data);
    }
    onControlChannelR(data) {
        this.console.log('control-channelR: ' + data);
    }
    onControlChannelW(data) {
        this.console.log('control-channelW: ' + data);
    }
    coqtopOut(data) {
        this.console.log('coqtop-stdout:' + data);
    }
    onFeedback(feedback) {
        if (this.onFeedback)
            this.callbacks.onFeedback(feedback);
    }
    onMessage(msg) {
        if (this.callbacks.onMessage)
            this.callbacks.onMessage(msg);
    }
    onOther(tag, x) {
        // this.console.log("reponse: " + tag + ": " + util.inspect(x));    
    }
    onSerializationError(x) { }
    validateValue(value, logIdent) {
        if (value.message === 'User interrupt.')
            throw new Interrupted(value.stateId);
        else {
            let error = new CallFailure(value.message, value.stateId);
            if (value.location)
                error.range = value.location;
            // this.console.log(`ERROR ${logIdent || ""}: ${value.stateId} --> ${value.error.message} ${value.error.range ? `@ ${value.error.range.start}-${value.error.range.stop}`: ""}`);
            throw error;
        }
    }
    /**
     * Note: this needs to be called before this.mainChannelW.write to ensure that the handler for 'response: value'
     * is installed on time
     */
    coqGetResultOnce(logIdent) {
        return new Promise((resolve, reject) => {
            this.parser.once('response: value', (value) => {
                try {
                    if (value.status === 'good')
                        resolve(value);
                    else
                        this.validateValue(value, logIdent);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    /**
     * Note: this needs to be called before this.mainChannelW.write to ensure that the handler for 'response: value'
     * is installed on time
     */
    coqGetMessageOnce() {
        return new Promise((resolve, reject) => {
            this.parser.once('response: message', (value) => {
                try {
                    resolve(value);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    coqInterrupt() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.coqtopProc)
                return;
            if (this.supportsInterruptCall) {
                this.parser.once('response: value', (value) => {
                    this.console.log('interrupted');
                });
                this.console.log('interrupt');
                this.console.log('--------------------------------');
                this.console.log('Call Interrupt()');
                this.mainChannelW.write('<call val="Interrupt"><unit/></call>');
            }
            else {
                this.console.log('--------------------------------');
                this.console.log('Sending SIGINT');
                this.coqtopProc.kill("SIGINT");
            }
        });
    }
    coqInit() {
        return __awaiter(this, void 0, void 0, function* () {
            const coqResult = this.coqGetResultOnce('Init');
            this.console.log('--------------------------------');
            this.console.log('Call Init()');
            this.mainChannelW.write('<call val="Init"><option val="none"/></call>');
            const timeout = 3000;
            // try {
            const value = coqProto.GetValue('Init', yield coqResult);
            const result = { stateId: value };
            this.console.log(`Init: () --> ${result.stateId}`);
            return result;
            // } catch(error) {
            //   this.console.warn(`Init: () --> TIMEOUT after ${timeout}ms`);
            //   this.cleanup(`Init: () --> TIMEOUT after ${timeout}ms`);
            //   throw error;
            // }    
            // this.controlChannelR.write("PING\n");
        });
    }
    coqQuit() {
        return __awaiter(this, void 0, void 0, function* () {
            // this.console.log('quit');
            try {
                const coqResult = this.coqGetResultOnce('Quit');
                this.console.log('--------------------------------');
                this.console.log('Call Quit()');
                this.mainChannelW.write('<call val="Quit"><unit/></call>');
                try {
                    yield Promise.race([coqResult, new Promise((resolve, reject) => setTimeout(reject, 1000, "timeout"))]);
                    this.console.log(`Quit: () --> ()`);
                }
                catch (err) {
                    this.console.log(`Forced Quit (timeout).`);
                }
            }
            catch (error) {
                this.console.log(`Forced Quit.`);
            }
            finally {
                this.cleanup(undefined);
            }
        });
    }
    countBackgroundGoals(g) {
        let count = 0;
        while (g) {
            count += g.before.length + g.after.length;
            g = g.next;
        }
        return count;
    }
    coqGoal() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkState();
            const coqResult = this.coqGetResultOnce('Goal');
            this.console.log('--------------------------------');
            this.console.log('Call Goal()');
            this.mainChannelW.write('<call val="Goal"><unit/></call>');
            const value = coqProto.GetValue('Goal', yield coqResult);
            if (value !== null) {
                const result = {
                    goals: value.goals,
                    backgroundGoals: value.backgroundGoals,
                    shelvedGoals: value.shelvedGoals,
                    abandonedGoals: value.abandonedGoals
                };
                // this.console.log(`Goal: () --> focused: ${result.goals.length}, unfocused: ${this.countBackgroundGoals(result.backgroundGoals)}, shelved: ${result.shelvedGoals.length}, abandoned: ${result.abandonedGoals.length}`);
                return Object.assign(result, { mode: 'proof' });
            }
            else {
                // this.console.log(`Goal: () --> No Proof`);
                return { mode: 'no-proof' };
            }
            // this.console.log(`Goal: -->`);
            // if (result.goals && result.goals.length > 0) {
            //   this.console.log("Current:");
            //   result.goals.forEach((g, i) => this.console.log(`    ${i + 1}:${g.id}= ${g.goal}`));
            // }
            // if (result.backgroundGoals) {
            //   this.console.log("Background: ...");
            //   // result.backgroundGoals.forEach((g, i) => this.console.log(`    ${i + 1}) ${util.inspect(g, false, null)}`));
            // }
            // if (result.shelvedGoals && result.shelvedGoals.length > 0) {
            //   this.console.log("Shelved:");
            //   result.shelvedGoals.forEach((g, i) => this.console.log(`    ${i + 1}) ${util.inspect(g, false, null)}`));
            // }
            // if (result.abandonedGoals && result.abandonedGoals.length > 0) {
            //   this.console.log("Abandoned:");
            //   result.abandonedGoals.forEach((g, i) => this.console.log(`    ${i + 1}) ${util.inspect(g, false, null)}`));
            // }
        });
    }
    getStatus(force) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkState();
            const coqResult = this.coqGetResultOnce('Status');
            // const verboseStr = verbose===true ? "true" : "false";
            this.console.log('--------------------------------');
            this.console.log(`Call Status(force: ${force})`);
            this.mainChannelW.write(`<call val="Status"><bool val="${force ? "true" : "false"}" /></call>`);
            return coqProto.GetValue('Status', yield coqResult);
        });
    }
    coqAddCommand(command, editId, stateId, verbose) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkState();
            const coqResult = this.coqGetResultOnce('Add');
            // const verboseStr = verbose===true ? "true" : "false";
            const verboseStr = verbose === false ? "false" : "true";
            this.console.log('--------------------------------');
            this.console.log(`Call Add("${command.trim().substr(0, 20) + (command.trim().length > 20 ? "..." : "")}", editId: ${editId}, stateId: ${stateId}, verbose: ${verboseStr})`);
            this.mainChannelW.write(`<call val="Add"><pair><pair><string>${coqXml.escapeXml(command)}</string><int>${editId}</int></pair><pair><state_id val="${stateId}"/><bool val="${verboseStr}"/></pair></pair></call>`);
            const value = coqProto.GetValue('Add', yield coqResult);
            let result = {
                stateId: value.assignedState,
                message: value.message,
                unfocusedStateId: value.nextFocusState,
            };
            if (result.stateId === undefined)
                this.console.log(`UNDEFINED Add: ` + util.inspect(value, false, undefined));
            this.console.log(`Add:  ${stateId} --> ${result.stateId} ${result.unfocusedStateId ? `(unfocus ${result.unfocusedStateId})` : ""} "${result.message || ""}"`);
            return result;
        });
    }
    coqEditAt(stateId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkState();
            const coqResult = this.coqGetResultOnce('EditAt');
            this.console.log('--------------------------------');
            this.console.log(`Call EditAt(stateId: ${stateId})`);
            this.mainChannelW.write(`<call val="Edit_at"><state_id val="${stateId}"/></call>`);
            const value = coqProto.GetValue('Edit_at', yield coqResult);
            let result;
            if (value) {
                // Jumping inside another proof; create a new tip
                result = { enterFocus: {
                        stateId: value.focusedState,
                        qedStateId: value.focusedQedState,
                        oldStateIdTip: value.oldFocusedState,
                    } };
            }
            else {
                result = {};
            }
            this.console.log(`EditAt: ${stateId} --> ${result.enterFocus ? `{newTipId: ${result.enterFocus.stateId}, qedId: ${result.enterFocus.qedStateId}, oldId: ${result.enterFocus.oldStateIdTip}}` : "{}"}`);
            return result;
        });
    }
    coqLtacProfilingResults(stateId, routeId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkState();
            stateId = stateId || 0;
            const routeAttr = typeof routeId === 'number' ? ` route="${routeId}"` : "";
            const coqResult = this.coqGetResultOnce('Query');
            this.console.log('--------------------------------');
            this.console.log(`Call Query(query: "Show Ltac Profile.", stateId: ${stateId}, routeId: ${routeId})`);
            this.mainChannelW.write(`<call val="Query"${routeAttr}><pair><string>Show Ltac Profile.</string><state_id val="${stateId}"/></pair></call>`);
            const value = coqProto.GetValue('Query', yield coqResult);
            // return {total_time: 0, tactics:[]};;
            // let result : LtacProfResults = value['ltacprof'];
            // this.console.log(`LtacProfResults: () --> ...`);
            // return result;
        });
    }
    // public async setOptions() {
    //   if(this.coqtopProc === null)
    //     return;
    //   const coqResult = this.coqGetResultOnce('SetOptions');
    //   this.console.log('--------------------------------');
    //   this.console.log(`Call ResizeWindow(columns: ${columns})`);
    //   this.mainChannelW.write(`<call val="SetOptions"><list><pair><list><string>Printing</string><string>Width</string></list><option_value val="intvalue"><option val="some"><int>${columns}</int></option></option_value></pair></list></call>`);
    // }
    coqResizeWindow(columns) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.coqtopProc === null)
                return;
            const coqResult = this.coqGetResultOnce('SetOptions');
            this.console.log('--------------------------------');
            this.console.log(`Call ResizeWindow(columns: ${columns})`);
            this.mainChannelW.write(`<call val="SetOptions"><list><pair><list><string>Printing</string><string>Width</string></list><option_value val="intvalue"><option val="some"><int>${columns}</int></option></option_value></pair></list></call>`);
            const result = coqProto.GetValue('SetOptions', yield coqResult);
            this.console.log(`ResizeWindow: ${columns} --> ()`);
        });
    }
    coqQuery(query, stateId, routeId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkState();
            if (stateId === undefined)
                stateId = 0;
            const routeAttr = typeof routeId === 'number' ? ` route="${routeId}"` : "";
            const coqResult = this.coqGetResultOnce('Query');
            const coqMessageResult = this.coqGetMessageOnce();
            this.console.log('--------------------------------');
            this.console.log(`Call Query(stateId: ${stateId}, ${routeId !== undefined ? "routeId: " + routeId + ", " : ""}query: ${query})`);
            this.mainChannelW.write(`<call val="Query"${routeAttr}><pair><string>${coqXml.escapeXml(query)}</string><state_id val="${stateId}"/></pair></call>`);
            // this.mainChannelW.write(`<call val="Query"><pair><string>${entities.encodeXML(query)}</string><state_id val="${stateId}"/></pair></call>`);    
            const values = yield Promise.all([coqMessageResult, coqResult.then(() => null)]);
            this.console.log(`Query: ${stateId} --> ...`);
            return values[0].message;
            // return entities.decodeXML(values[0].message);
            //     this.checkState();
            // 
            //     const coqResult = this.coqGetResultOnce('Locate');
            //     // const verboseStr = verbose===true ? "true" : "false";
            //     const verboseStr = verbose === false ? "false" : "true";
            //     this.console.log('--------------------------------');
            //     this.console.log(`Call Add("${command.trim().substr(0, 20) + (command.trim().length > 20 ? "..." : "")}", editId: ${editId}, stateId: ${stateId}, verbose: ${verboseStr})`);
            //     this.mainChannelW.write(`<call val="Add"><pair><pair><string>${command}</string><int>${editId}</int></pair><pair><state_id val="${stateId}"/><bool val="${verboseStr}"/></pair></pair></call>`);
            // 
            //     const value = await coqResult;
            //     let result = <AddResult>{
            //       stateId: value.stateId,
            //       message: value.message,
            //     };
            //     if (value.unfocusedStateId)
            //       result.unfocusedStateId = value.unfocusedStateId;
            //     this.console.log(`Add:  ${stateId} --> ${result.stateId} ${result.unfocusedStateId ? "(unfocus ${result.unfocusedStateId})" : ""} "${result.message || ""}"`);
            //     return result;
        });
    }
    coqGetOptions(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkState();
            const coqResult = this.coqGetResultOnce('GetOptions');
            const coqMessageResult = this.coqGetMessageOnce();
            this.console.log('--------------------------------');
            this.console.log(`Call GetOptions()`);
            this.mainChannelW.write(`<call val="GetOptions"><unit/></call>`);
            const values = coqProto.GetValue('GetOptions', yield coqResult);
            this.console.log(`GetOptions: () --> ...`);
        });
    }
    coqSetOptions(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkState();
            let xmlOptions = [];
            for (let optionKey in options) {
                const rawOptionsName = CoqOptionsMapping[optionKey];
                const rawOptionsValue = options[optionKey];
                if (rawOptionsValue !== undefined && typeof rawOptionsName === 'string') {
                    const optionName = rawOptionsName.split(' ');
                    xmlOptions.push(new xmlTypes.Pair(optionName, new xmlTypes.OptionValue(rawOptionsValue)));
                }
            }
            const coqResult = this.coqGetResultOnce('SetOptions');
            const coqMessageResult = this.coqGetMessageOnce();
            this.console.log('--------------------------------');
            this.console.log(`Call SetOptions(...)`);
            // this.console.log(`Call SetOptions(${xmlTypes.encode(xmlOptions)})`);
            this.mainChannelW.write(`<call val="SetOptions">${xmlTypes.encode(xmlOptions)}</call>`);
            const values = coqProto.GetValue('SetOptions', yield coqResult);
            this.console.log(`SetOptions: (...) --> ...`);
        });
    }
}
exports.CoqTop = CoqTop;
const CoqOptionsMapping = {
    asymmetricPatterns: "Asymmetric Patterns",
    atomicLoad: "Atomic Load",
    automaticCoercionsImport: "Automatic Coercions Import",
    automaticIntroduction: "Automatic Introduction",
    booleanEqualitySchemes: "Boolean Equality Schemes",
    bracketingLastIntroductionPattern: "Bracketing Last Introduction Pattern",
    bulletBehavior: "Bullet Behavior",
    subproofsCaseAnalysisSchemes: "Subproofs Case Analysis Schemes",
    compatNotations: "Compat Notations",
    congruenceDepth: "Congruence Depth",
    congruenceVerbose: "Congruence Verbose",
    contextualImplicit: "Contextual Implicit",
    debugAuto: "Debug Auto",
    debugEauto: "Debug Eauto",
    debugRAKAM: "Debug Rakam",
    debugTacticUnification: "Debug Tactic Unification",
    debugTrivial: "Debug Trivial",
    debugUnification: "Debug Unification",
    decidableEqualitySchemes: "Decidable Equality Schemes",
    defaultClearingUsedHypotheses: "Default Clearing Used Hypotheses",
    defaultGoalSelector: "Default Goal Selector",
    defaultProofMode: "Default Proof Mode",
    defaultProofUsing: "Default Proof Using",
    defaultTimeout: "Default Timeout",
    dependentPropositionsElimination: "Dependent Propositions Elimination",
    discriminateIntroduction: "Discriminate Introduction",
    dumpBytecode: "Dump Bytecode",
    eliminationSchemes: "Elimination Schemes",
    equalityScheme: "Equality Scheme",
    extractionAutoInline: "Extraction Auto Inline",
    extractionConservativeTypes: "Extraction Conservative Types",
    extractionFileComment: "Extraction File Comment",
    extractionFlag: "Extraction Flag",
    extractionKeepSingleton: "Extraction Keep Singleton",
    extractionOptimize: "Extraction Optimize",
    extractionSafeImplicits: "Extraction Safe Implicits",
    extractionTypeExpand: "Extraction Type Expand",
    firstorderDepth: "Firstorder Depth",
    hideObligations: "Hide Obligations",
    implicitArguments: "Implicit Arguments",
    infoAuto: "Info Auto",
    infoEauto: "Info Eauto",
    infoLevel: "Info Level",
    infoTrivial: "Info Trivial",
    injectionL2RPatternOrder: "Injection L2 Rpattern Order",
    injectionOnProofs: "Injection On Proofs",
    inlineLevel: "Inline Level",
    intuitionIffUnfolding: "Intuition Iff Unfolding",
    intuitionNegationUnfolding: "Intuition Negation Unfolding",
    kernelTermSharing: "Kernel Term Sharing",
    keyedUnification: "Keyed Unification",
    looseHintBehavior: "Loose Hint Behavior",
    maximalImplicitInsertion: "Maximal Implicit Insertion",
    nonrecursiveEliminationSchemes: "Nonrecursive Elimination Schemes",
    parsingExplicit: "Parsing Explicit",
    primitiveProjections: "Primitive Projections",
    printingAll: "Printing All",
    printingCoercions: "Printing Coercions",
    printingDepth: "Printing Depth",
    printingExistentialInstances: "Printing Existential Instances",
    printingImplicit: "Printing Implicit",
    printingImplicitDefensive: "Printing Implicit Defensive",
    printingMatching: "Printing Matching",
    printingNotations: "Printing Notations",
    printingPrimitiveProjectionCompatibility: "Printing Primitive Projection Compatibility",
    printingPrimitiveProjectionParameters: "Printing Primitive Projection Parameters",
    printingProjections: "Printing Projections",
    printingRecords: "Printing Records",
    printingSynth: "Printing Synth",
    printingUniverses: "Printing Universes",
    printingWidth: "Printing Width",
    printingWildcard: "Printing Wildcard",
    programMode: "Program Mode",
    proofUsingClearUnused: "Proof Using Clear Unused",
    recordEliminationSchemes: "Record Elimination Schemes",
    regularSubstTactic: "Regular Subst Tactic",
    reversiblePatternImplicit: "Reversible Pattern Implicit",
    rewritingSchemes: "Rewriting Schemes",
    shortModulePrinting: "Short Module Printing",
    shrinkObligations: "Shrink Obligations",
    simplIsCbn: "Simpl Is Cbn",
    standardPropositionEliminationNames: "Standard Proposition Elimination Names",
    strictImplicit: "Strict Implicit",
    strictProofs: "Strict Proofs",
    strictUniverseDeclaration: "Strict Universe Declaration",
    stronglyStrictImplicit: "Strongly Strict Implicit",
    suggestProofUsing: "Suggest Proof Using",
    tacticCompatContext: "Tactic Compat Context",
    tacticEvarsPatternUnification: "Tactic Evars Pattern Unification",
    transparentObligations: "Transparent Obligations",
    typeclassResolutionAfterApply: "Typeclass Resolution After Apply",
    typeclassResolutionForConversion: "Typeclass Resolution For Conversion",
    typeclassesDebug: "Typeclasses Debug",
    typeclassesDependencyOrder: "Typeclasses Dependency Order",
    typeclassesDepth: "Typeclasses Depth",
    typeclassesModuloEta: "Typeclasses Modulo Eta",
    typeclassesStrictResolution: "Typeclasses Strict Resolution",
    typeclassesUniqueInstances: "Typeclasses Unique Instances",
    typeclassesUniqueSolutions: "Typeclasses Unique Solutions",
    universalLemmaUnderConjunction: "Universal Lemma Under Conjunction",
    universeMinimizationToSet: "Universe Minimization To Set",
    universePolymorphism: "Universe Polymorphism",
    verboseCompatNotations: "Verbose Compat Notations",
};
//# sourceMappingURL=coqtop.js.map