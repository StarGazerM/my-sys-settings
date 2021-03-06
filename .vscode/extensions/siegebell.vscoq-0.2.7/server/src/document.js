'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const vscode_languageserver_1 = require('vscode-languageserver');
const vscode = require('vscode-languageserver');
const thmProto = require('./protocol');
const coqProto = require('./coqtop/coq-proto');
const coqParser = require('./parsing/coq-parser');
// import {Sentence, Sentences} from './sentences';
const textUtil = require('./util/text-util');
const AnnotatedText_1 = require('./util/AnnotatedText');
const STM_1 = require('./stm/STM');
const FeedbackSync_1 = require('./FeedbackSync');
const SentenceCollection_1 = require('./sentence-model/SentenceCollection');
function rangeToString(r) { return `[${positionToString(r.start)},${positionToString(r.end)})`; }
function positionToString(p) { return `{${p.line}@${p.character}}`; }
var InteractionLoopStatus;
(function (InteractionLoopStatus) {
    InteractionLoopStatus[InteractionLoopStatus["Idle"] = 0] = "Idle";
    InteractionLoopStatus[InteractionLoopStatus["CoqCommand"] = 1] = "CoqCommand";
    InteractionLoopStatus[InteractionLoopStatus["TextEdit"] = 2] = "TextEdit";
})(InteractionLoopStatus || (InteractionLoopStatus = {}));
;
var StepResult;
(function (StepResult) {
    StepResult[StepResult["Focused"] = 0] = "Focused";
    StepResult[StepResult["Unfocused"] = 1] = "Unfocused";
    StepResult[StepResult["ExceedsMaxOffset"] = 2] = "ExceedsMaxOffset";
    StepResult[StepResult["NoMoreCommands"] = 3] = "NoMoreCommands";
})(StepResult || (StepResult = {}));
// 'sticky' flag is not yet supported :()
const lineEndingRE = /[^\r\n]*(\r\n|\r|\n)?/;
class CoqDocument {
    // private interactionCommands = new AsyncWorkQueue();
    // private interactionLoopStatus = InteractionLoopStatus.Idle;
    // we'll use this as a callback, so protect it with an arrow function so it gets the correct "this" pointer
    constructor(project, document, clientConsole, callbacks) {
        this.document = null;
        this.parsingRanges = [];
        this.clientConsole = clientConsole;
        this.document = new SentenceCollection_1.SentenceCollection(document);
        this.callbacks = callbacks;
        this.project = project;
        this.feedback = new FeedbackSync_1.FeedbackSync(callbacks, 200);
        this.resetCoq();
        // this.reset();
        // Start a worker to handle incomming commands and text edits in a sequential manner
        // this.interactionLoop();
    }
    // TextDocument
    get uri() { return this.document.uri; }
    ;
    get languageId() { return this.document.languageId; }
    ;
    get version() { return this.document.version; }
    ;
    get lineCount() { return this.document.lineCount; }
    ;
    getText() {
        return this.document.getText();
        ;
    }
    getTextOfRange(range) {
        const start = this.offsetAt(range.start);
        const end = this.offsetAt(range.end);
        return this.document.getText().substring(start, end);
    }
    applyTextEdits(changes, newVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            // sort the edits such that later edits are processed first
            let sortedChanges = changes.sort((change1, change2) => textUtil.positionIsAfter(change1.range.start, change2.range.start) ? -1 : 1);
            this.document.applyTextChanges(newVersion, changes);
            if (!this.isStmRunning())
                return;
            try {
                const passive = this.stm.applyChanges(sortedChanges, newVersion, this.document.getText());
            }
            catch (err) {
                this.clientConsole.error("STM crashed while applying text edit: " + err.toString());
            }
            this.updateHighlights();
            this.updateDiagnostics();
        });
    }
    getSentences() {
        return this.document;
    }
    getSentencePrefixTextAt(pos) {
        return this.document.getSentencePrefixTextAt(pos);
    }
    offsetAt(pos) {
        return this.document.offsetAt(pos);
    }
    /**
     * @returns the Position (line, column) for the location (character position)
     */
    positionAt(offset) {
        return this.document.positionAt(offset);
    }
    // private sentenceStatusToHighlightType(status: coqProto.SentenceStatus) : thmProto.HighlightType {
    //   switch(status) {
    //     case coqProto.SentenceStatus.Complete:
    //       return thmProto.HighlightType.Complete;
    //     case coqProto.SentenceStatus.Incomplete:
    //       return thmProto.HighlightType.Incomplete;
    //     case coqProto.SentenceStatus.InProgress:
    //       return thmProto.HighlightType.InProgress;
    //     case coqProto.SentenceStatus.Parsed:
    //       return thmProto.HighlightType.Parsing;
    //     case coqProto.SentenceStatus.Processed:
    //       return thmProto.HighlightType.Processed;
    //     case coqProto.SentenceStatus.ProcessingInput:
    //       return thmProto.HighlightType.Processing;
    //   }    
    // }
    // private highlightTypeToSentenceStatus(type: thmProto.HighlightType) : coqProto.SentenceStatus {
    //   switch(type) {
    //     case thmProto.HighlightType.Complete:
    //       return coqProto.SentenceStatus.Complete;
    //     case thmProto.HighlightType.Incomplete:
    //       return coqProto.SentenceStatus.Incomplete;
    //     case thmProto.HighlightType.InProgress:
    //       return coqProto.SentenceStatus.InProgress;
    //     case thmProto.HighlightType.Parsing:
    //       return coqProto.SentenceStatus.Parsed;
    //     case thmProto.HighlightType.Processed:
    //       return coqProto.SentenceStatus.Processed;
    //     case thmProto.HighlightType.Processing:
    //       return coqProto.SentenceStatus.ProcessingInput;
    //     default:
    //       throw `Cannot convert ${thmProto.HighlightType[type]} to a SentenceStatus`
    //   }    
    // }
    // private highlightSentence(sentence: Range, type: thmProto.HighlightType) : thmProto.Highlight {
    //   // if(type===undefined)
    //   //     type = this.sentenceStatusToHighlightType(sentence.status);
    //   return { style: type, range: sentence };
    // }
    sentenceToHighlightType(status) {
        switch (status) {
            case STM_1.StateStatus.Axiom: return thmProto.HighlightType.Axiom;
            case STM_1.StateStatus.Error: return thmProto.HighlightType.StateError;
            case STM_1.StateStatus.Parsing: return thmProto.HighlightType.Parsing;
            case STM_1.StateStatus.Processing: return thmProto.HighlightType.Processing;
            case STM_1.StateStatus.Incomplete: return thmProto.HighlightType.Incomplete;
            case STM_1.StateStatus.Processed: return thmProto.HighlightType.Processed;
        }
    }
    /** creates the current highlights from scratch */
    createHighlights() {
        if (!this.isStmRunning())
            return;
        const highlights = { ranges: [[], [], [], [], [], []] };
        let count1 = 0;
        let count2 = 0;
        for (let sent of this.stm.getSentences()) {
            const ranges = highlights.ranges[this.sentenceToHighlightType(sent.status)];
            if (ranges.length > 0 && textUtil.positionIsEqual(ranges[ranges.length - 1].end, sent.range.start))
                ranges[ranges.length - 1].end = sent.range.end;
            else {
                ranges.push(vscode_languageserver_1.Range.create(sent.range.start, sent.range.end));
                ++count2;
            }
            ++count1;
        }
        return highlights;
    }
    /** creates the current diagnostics from scratch */
    createDiagnostics() {
        if (!this.isStmRunning())
            return;
        let diagnostics = [];
        for (let error of this.stm.getErrors()) {
            diagnostics.push({ message: AnnotatedText_1.textToDisplayString(error.message),
                range: error.range,
                severity: 1 /* Error */,
                source: 'coq'
            });
        }
        return diagnostics;
    }
    onCoqStateStatusUpdate(range, status) {
        this.updateHighlights();
    }
    onClearSentence(range) {
        // this.updateHighlights();
    }
    updateHighlights(now = false) {
        this.feedback.updateHighlights(() => {
            const highlights = this.createHighlights();
            const parsingRanges = highlights.ranges[thmProto.HighlightType.Parsing];
            Array.prototype.push.apply(parsingRanges, this.parsingRanges);
            return highlights;
        }, now);
    }
    onCoqStateError(sentenceRange, errorRange, message) {
        this.updateHighlights();
        this.updateDiagnostics();
        // this.addDiagnostic(
        //   { message: message
        //   , range: errorRange
        //   , severity: DiagnosticSeverity.Error
        //   });
    }
    onCoqMessage(level, message) {
        this.callbacks.sendMessage(coqProto.MessageLevel[level], message);
    }
    onCoqStateLtacProf(range, results) {
        this.callbacks.sendLtacProfResults(results);
    }
    onCoqDied(error) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!error)
                return;
            this.resetCoq();
            this.callbacks.sendReset();
        });
    }
    resetCoq() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isStmRunning())
                this.stm.shutdown(); // Don't bother awaiting
            this.stm = new STM_1.CoqStateMachine(this.project, this.uri, {
                sentenceStatusUpdate: (x1, x2) => this.onCoqStateStatusUpdate(x1, x2),
                clearSentence: (x1) => this.onClearSentence(x1),
                updateStmFocus: (x1) => this.onUpdateStmFocus(x1),
                error: (x1, x2, x3) => this.onCoqStateError(x1, x2, x3),
                message: (x1, x2) => this.onCoqMessage(x1, x2),
                ltacProfResults: (x1, x2) => this.onCoqStateLtacProf(x1, x2),
                coqDied: (error) => this.onCoqDied(error),
            });
        });
    }
    onUpdateStmFocus(focus) {
        this.feedback.updateFocus(focus, false);
    }
    // private async cancellableOperation<T>(operation: Thenable<T>) : Promise<T> {
    //   return await Promise.race<T>(
    //     [ operation
    //     , this.cancelProcessing.event.then(() => Promise.reject<T>('operation cancelled'))
    //     ]);
    // }
    /** generates a list of contiguous commands
     * @param begin: where to start parsing commands
     * @param endOffset: if specified, stop at the last command to not exceed the offset
     */
    *commandSequenceGenerator(begin, end, highlight = false) {
        const documentText = this.document.getText();
        let endOffset;
        if (end === undefined)
            endOffset = documentText.length;
        else
            endOffset = Math.min(this.offsetAt(end), documentText.length);
        let currentOffset = this.offsetAt(begin);
        if (currentOffset >= endOffset)
            return;
        while (true) {
            const commandLength = coqParser.parseSentenceLength(documentText.substr(currentOffset, endOffset));
            const nextOffset = currentOffset + commandLength;
            if (commandLength > 0 || nextOffset > endOffset) {
                let result = { text: documentText.substring(currentOffset, nextOffset),
                    range: vscode_languageserver_1.Range.create(this.positionAt(currentOffset), this.positionAt(nextOffset))
                };
                yield result;
                // only highlight if the command was accepted (i.e. another is going to be request; i.e. after yield)
                if (highlight) {
                    this.parsingRanges.push(result.range);
                    this.updateHighlights(true);
                }
            }
            else
                return;
            currentOffset = nextOffset;
        }
    }
    commandSequence(highlight = false) {
        return (begin, end) => this.commandSequenceGenerator(begin, end, highlight);
    }
    // /**
    //  * @param currentSentence: where to start parsing the next sentence
    //  * @param maxOffset: do not parse past maxOffset
    //  * @returns the next parsed sentence OR else null if parsing exceeds @maxOffset
    //  */
    // private async plainStepForward(maxOffset?: number) : Promise<StepResult> {
    //   const start = this.stm.getFocusedPosition();
    //   const startOffset = this.offsetAt(start);
    //   const docText = this.documentText;
    //   const sentenceLength = coqParser.parseSentence(this.documentText.substr(startOffset,maxOffset));
    //   if(sentenceLength == -1)
    //     return StepResult.NoMoreCommands;
    //   const stopPos = startOffset + sentenceLength;
    //   if(maxOffset!==undefined && stopPos > maxOffset)
    //     return StepResult.ExceedsMaxOffset;
    //   const range = Range.create(start,this.positionAt(stopPos));
    //   let command = docText.substring(startOffset, stopPos);
    //   // Preliminary "parsing" highlight
    //   const parsingHighlights = [
    //     { style: thmProto.HighlightType.Parsing, textBegin: startOffset, textEnd: stopPos }
    //     ];
    //   this.callbacks.sendHighlightUpdates(parsingHighlights);
    //   try {
    //     const unfocused = await this.stm.stepForward(command, range, this.version, true);
    //     return unfocused ? StepResult.Unfocused : StepResult.Focused;
    //   } catch(err) {
    //     const error = <CommandParseError>err;
    //     const highlights = [
    //       { style: thmProto.HighlightType.Clear, textBegin: startOffset, textEnd: stopPos }
    //       // { style: thmProto.HighlightType.SyntaxError, textBegin: errorEnd, textEnd: errorEnd },
    //       ];
    //     this.callbacks.sendHighlightUpdates(highlights);
    //     this.addDiagnostic({
    //       message: error.message,
    //       range: error.range,
    //       severity: DiagnosticSeverity.Error
    //       });
    //     throw error;
    //   }
    // }
    // private async addDiagnostic(diagnostic: Diagnostic) {
    //   const diag = diagnostic;
    //   diag.message = await richppToMarkdown(diag.message);
    //   this.diagnostics.push(diag);
    //   this.callbacks.sendDiagnostics(this.diagnostics);
    // }
    // private removeDiagnosticsContaining(pos: Position, sendUpdate?: boolean) {
    //   this.diagnostics = this.diagnostics
    //     .filter((d) => !textUtil.rangeContains(d.range, pos));
    //   if(sendUpdate === undefined || sendUpdate===true)
    //     this.callbacks.sendDiagnostics(this.diagnostics);
    // }
    // private removeDiagnosticsIntersecting(range: Range, sendUpdate?: boolean) {
    //   this.diagnostics = this.diagnostics
    //     .filter((d) => !textUtil.rangeTouches(d.range, range));
    //   if(sendUpdate === undefined || sendUpdate===true)
    //     this.callbacks.sendDiagnostics(this.diagnostics);
    // }
    // private shiftDiagnostics(delta: textUtil.RangeDelta) {
    //   for(let idx = 0; idx < this.diagnostics.length; ++idx) {
    //     this.diagnostics[idx].range = textUtil.rangeTranslate(this.diagnostics[idx].range, delta);
    //   }
    // }
    // private clearSentenceHighlight(sentence: Sentence, endSentence?: Sentence) {
    //   this.callbacks.sendHighlightUpdates([{
    //     style: thmProto.HighlightType.Clear,
    //     textBegin: sentence.textBegin,
    //     textEnd: endSentence ? endSentence.textEnd : sentence.textEnd
    //   }]);
    // }
    // private clearSentenceHighlightAfter(sentence: Sentence, endSentence?: Sentence) {
    //   this.callbacks.sendHighlightUpdates([{
    //     style: thmProto.HighlightType.Clear,
    //     textBegin: sentence.textEnd,
    //     textEnd: endSentence ? endSentence.textEnd : sentence.textEnd
    //   }]);
    // }
    // /** Interpret to point
    //  * Tell Coq to process the proof script up to the given point
    //  * This may not fully process everything, or it may rewind the state.
    //  */
    // private async interpretToPoint(position: Position) : Promise<thmProto.CoqTopGoalResult> {
    //   try {
    //     do {
    //       const focus = this.stm.getFocusedPosition();
    //       const focusOffset = this.offsetAt(focus);
    //       const offset = this.offsetAt(position);
    //       if(textUtil.positionIsAfterOrEqual(position, focus)) {
    //         // We need to step forward to reach the location.
    //         // We might be focused in the middle of a proof, so even if there is a
    //         // closer state we can jump to, we cannot call coqEditAt just yet.
    //         // (Or else we will get a Coq anomally :/ )
    //         for(let command of this.commandSequence(focus,offset)) {
    //           const focusChanged = this.stm.stepForward(command.text, command.range, this.version, true);
    //           if(focusChanged)
    //             break;
    //         }
    //         // At this point, either we have reached the location we're looking for,
    //         // or else the proof has become unfocused (the current state might be
    //         // anywhere) and we will need to call coqEditAt to get closer to the location.      
    //         const closestSentence = this.sentences.findPrecedingSentence(location);
    //         // Are we at the closest sentence?
    //         if(forwardSentence.stateId !== closestSentence.stateId) {
    //           // No; jump there
    //           await this.jumpToLocation(closestSentence);
    //         }
    //         // We can now step forward directly to the location
    //         return await this.interpretToEnd(location);
    //       } else {
    //         // Our desired location is above us; we'll have to jump there
    //         const closestSentence = this.sentences.findPrecedingSentence(location);
    //         await this.jumpToLocation(closestSentence);
    //         return await this.rawGetGoal();
    //       }
    //     }
    //   } catch(error) {
    //     return this.errorGoalResult(error);
    //   }
    // }
    // private errorGoalResult(error: FailureResult) : thmProto.CoqTopGoalResult {
    //   const e = <coqProto.FailValue>{
    //     message: error.message,
    //     range: error.range
    //     };
    //   return {error: e};
    // }
    // /**
    //  * 
    //  *  */  
    // private async interpretToEnd(maxOffset?: number) : Promise<thmProto.CoqTopGoalResult> {
    //   let currentSentence = this.sentences.getTip();
    //   try {
    //     await this.stepForwardUntil(maxOffset);
    //     return await this.rawGetGoal();
    //   } catch(error) {
    //     return this.errorGoalResult(error);
    //   }
    // }
    //   private async rollbackState(startingSentence: Sentence, endSentence?: Sentence) {
    //     if(this.sentences.getTip().stateId !== startingSentence.stateId) {
    //       // Undo the sentence
    // this.clientConsole.log("rolling back state");
    //       await this.coqTop.coqEditAt(startingSentence.stateId);
    //       this.sentences.rewindTo(startingSentence);
    //       if(endSentence !== undefined)
    //         this.clearSentenceHighlightAfter(startingSentence,endSentence);
    // this.clientConsole.log("rolled back");
    //     }
    //   }
    // private async stepForward() : Promise<thmProto.CoqTopGoalResult> {
    //   const currentSentence = this.sentences.getTip();
    //   try {
    //     const interp = await this.plainStepForward(currentSentence);
    //     if(!interp)
    //       return {}
    //     return await this.rawGetGoal(interp.nextSentence ? interp.nextSentence.stateId : undefined);
    //   } catch(error) {
    //     this.rollbackState(currentSentence);
    //     return this.errorGoalResult(error);
    //   }
    // }
    // /**
    //  * 
    //  *  */  
    // private async stepBackward() : Promise<thmProto.CoqTopGoalResult> {
    //   // grab the tip sentence
    //   const currentSentence = this.sentences.getTip();
    //   try {
    //     const prevSentence = this.sentences.getPredecessor(currentSentence);
    //     if(prevSentence == null) {
    //       await this.doResetCoq();
    //       return {};
    //     }
    //     await this.coqTop.coqEditAt(prevSentence.stateId);
    //     this.sentences.rewindTo(prevSentence);
    //     this.callbacks.sendHighlightUpdates([
    //       this.highlightSentence(currentSentence, thmProto.HighlightType.Clear)
    //       ]);
    //     return await this.rawGetGoal(prevSentence.stateId);
    //   } catch(err) {
    //     const error = <FailureResult>err;
    //     const beforeErrorSentence = this.sentences.get(error.stateId);
    //     await this.coqTop.coqEditAt(error.stateId);
    //     this.clearSentenceHighlightAfter(beforeErrorSentence,currentSentence);
    //     this.sentences.rewindTo(beforeErrorSentence);
    //     return await this.getGoal();
    //   }
    // }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isStmRunning()) {
                yield this.stm.shutdown();
                this.stm = null;
            }
        });
    }
    // private async protectOperation(op: (wasReset:boolean)=>Promise<thmProto.CoqTopGoalResult>, lazyInitialize?: boolean) : Promise<thmProto.CoqTopGoalResult> {
    //   lazyInitialize = (lazyInitialize===undefined) ? true : false;
    //   let unlock : () => Promise<void>; 
    //   try {
    //     unlock = await this.processingLock.lock(this.cancelProcessing.event);
    //   } catch(reason) {
    //     return <coqProto.FailValue>{message: "operation cancelled"};
    //   }
    //   try {
    //     if(!this.coqTop.isRunning()) {
    //       if(!lazyInitialize)
    //         return {};
    //       await this.cancellableOperation(this.doResetCoq());
    //       const result = await this.cancellableOperation(op(true));
    //     } else
    //       return await this.cancellableOperation(op(false));
    //   } catch(reason) {
    //     return <coqProto.FailValue>{message: reason};
    //   } finally {
    //     unlock();
    //   }
    // }  
    // private interrupt() {
    //   this.coqTop.coqInterrupt();
    // }
    // /**
    //  * This loop handles each coq command and text edit sequentially.
    //  * One of the requirements is that a command's document position is still valid when it returns so that we can report accurate error messages, so text edits that arrive while a command is being processed are delayed until the command finished so that we do not invalidate its document positions.
    //  * 
    //  * To cancel the current queue of commands, call cancelCoqOperations()  
    //  */
    // private async interactionLoop() {
    //   while(true) {
    //     try {
    //       await this.interactionCommands.executeOneTask();
    //     } catch(error) {
    //       this.clientConsole.warn(`Interaction loop exception: ${error}`);
    //     } finally {
    //     }
    //   }
    // }
    // /**
    //  * Ensures that the text edits are applied *after* the currently scheduled operations; this delay prevents their document positions from being invalidated too soon
    //  * However, if the edit will result in changing an already-interpreted sentence, then all current Coq processing will be cancelled.
    //  * Text edits themselves cannot be cancelled, but the Coq operations they may perform to set the current editing positions *can* be cancelled. 
    //  */
    // public textEdit(changes: TextDocumentContentChangeEvent[]) {
    //   // If any of the edits affect an interpreted sentence, then interrupt and cancel all Coq operations
    //   for(const change of changes) {
    //     const beginOffset = this.offsetAt(change.range.start);
    //     const endOffset = beginOffset + change.rangeLength;
    //     // Have any sentences been edited?
    //     const rangeSent = this.sentences.getRangeAffected(beginOffset,endOffset);
    //     if(!this.isPassiveEdit(rangeSent,change, beginOffset, endOffset) && rangeSent.length) {
    //       //this.clientConsole.info("Cancelling current Coq operations due to editing text of interpreted statements.");
    //       this.cancelCoqOperations();
    //       break;
    //     }
    //   }    
    //   const cancelSignal = this.cancelProcessing;
    //   return this.interactionCommands.process<void>(async () => {
    //     this.interactionLoopStatus = InteractionLoopStatus.TextEdit;
    //     try {
    //       // applyTextEdits will check for a cancellation signal during Coq calls, but text-editing itself should never be cancelled
    //       return await this.applyTextEdits(changes, cancelSignal);
    //     } finally {
    //       this.interactionLoopStatus = InteractionLoopStatus.Idle;
    //     }
    //   });
    // }
    // private updateComputingStatus(status: thmProto.ComputingStatus, startTime: [number,number]) {
    //   const duration = process.hrtime(startTime);
    //   const interval = duration[0] * 1000.0 + (duration[1] / 1000000.0);
    //   this.callbacks.sendComputingStatus(status, interval);
    // }
    // private async doCoqOperation<X>(task: ()=>Promise<X>, lazyInitializeCoq? : boolean) {
    //   lazyInitializeCoq = (lazyInitializeCoq===undefined) ? true : lazyInitializeCoq;
    //   if(!this.coqTop.isRunning()) {
    //     if(lazyInitializeCoq) {
    //       await this.doResetCoq();
    //     } else
    //       return {};
    //   }
    //   return await task();
    // }
    // private enqueueCoqOperation<X>(task: ()=>Promise<X>, lazyInitializeCoq? : boolean) {
    //   // this.cancelProcessing might change in the future, so we want to make sure that, when
    //   // the task is eventually run, it will use the CURRENT this.cancelProcessing
    //   const cancelSignal = this.cancelProcessing;
    //   return this.interactionCommands.process<X>(async () => {
    //     if(cancelSignal.isCancelled())
    //       return Promise.reject<X>(<coqProto.FailValue>{message: 'operation cancelled'})
    //     this.interactionLoopStatus = InteractionLoopStatus.CoqCommand;
    //     const startTime = process.hrtime();
    //     const statusCheck = setInterval(() => this.updateComputingStatus(thmProto.ComputingStatus.Computing, startTime), 500);
    //     var interrupted = false;
    //     try {
    //       return await Promise.race<X>(
    //         [ this.doCoqOperation(task, lazyInitializeCoq)
    //         , cancelSignal.event.then(() => Promise.reject<X>(<coqProto.FailValue>{message: 'operation cancelled'}))
    //         ]);
    //     } catch(error) {
    //       this.updateComputingStatus(thmProto.ComputingStatus.Interrupted, startTime);
    //       interrupted = true;
    //       throw error;
    //     } finally {
    //       this.interactionLoopStatus = InteractionLoopStatus.Idle;
    //       clearInterval(statusCheck);
    //       if(!interrupted)
    //         this.updateComputingStatus(thmProto.ComputingStatus.Finished, startTime);
    //     }
    //   });
    // }
    // /**
    //  * Cancels all coq commands that are associated with `cancelProcessing`, which should be every coq command in `interactionCommands`.
    //  * If a text edit invalidates a state, then this method should also be called.
    //  */
    // private cancelCoqOperations() : Promise<void> {
    //   // Cancel all current and pending operations
    //   this.cancelProcessing.cancel();
    //   // Do not cancel subsequent operations
    //   this.cancelProcessing = new CancellationSignal();
    //   if(this.interactionLoopStatus === InteractionLoopStatus.CoqCommand)
    //     return this.coqTop.coqInterrupt();
    // }
    // private async interactionsCoqQuit() {
    //   const waitMS = 1000;
    //   const cancelling = this.cancelCoqOperations();
    //   try {
    //     await Promise.race<{}>([cancelling, new Promise((resolve,reject) => setTimeout(() => reject(), waitMS))]);
    //   } finally {
    //     await this.coqTop.coqQuit();
    //   }
    // }
    // private async interactionsCoqReset() {
    //   const waitMS = 1000;
    //   const cancelling = this.cancelCoqOperations();
    //   try {
    //     await Promise.race<{}>([cancelling, new Promise((resolve,reject) => setTimeout(() => reject(), waitMS))]);
    //   } finally {
    //     await this.doResetCoq();
    //   }
    // }
    /** Make sure that the STM is running */
    assertStm() {
        if (!this.isStmRunning())
            this.resetCoq();
    }
    // private convertErrorToCommandResult(error: any) : thmProto.FailureResult {
    //   if(error instanceof Interrupted) {
    //     return undefined;
    //   } else if(error instanceof CoqtopError) {
    //   } else if(error instanceof CallFailure) {
    //     return Object.assign<thmProto.FailureResult,thmProto.FocusPosition>({type: 'failure', message: error.message, range: error.range, sentence: error.stateId}, {focus: this.stm.getFocusedPosition()})
    //   else
    //     throw error;
    // }
    toGoal(goal) {
        if (goal.type === 'not-running')
            return goal;
        else if (!this.isStmRunning())
            return { type: 'not-running', reason: 'not-started' };
        else if (goal.type === 'proof-view')
            return Object.assign(goal, { focus: this.stm.getFocusedPosition() });
        else if (goal.type === 'no-proof')
            return Object.assign(goal, { focus: this.stm.getFocusedPosition() });
        else if (goal.type === 'failure')
            return Object.assign(goal, { focus: this.stm.getFocusedPosition() });
        else if (goal.type === 'interrupted')
            return Object.assign(goal, { focus: this.stm.getFocusedPosition() });
        else if (goal.type === 'busy')
            return goal;
        //     export type GoalResult = proto.NoProofTag | proto.NotRunningTag |
        // (proto.FailValue & proto.FailureTag) |
        // (proto.ProofView & proto.ProofViewTag) |
        // (proto.CommandInterrupted & proto.InterruptedTag)
        //   export type FocusPosition = {focus: vscode.Position}
        // export type NotRunningTag = {type: 'not-running'}
        // export type NoProofTag = {type: 'no-proof'}
        // export type FailureTag = {type: 'failure'}
        // export type ProofViewTag = {type: 'proof-view'}
        // export type InterruptedTag = {type: 'interrupted'}
        // export type NotRunningResult = NotRunningTag
        // export type NoProofResult = NoProofTag & FocusPosition
        // export type FailureResult = FailValue & FailureTag & FocusPosition
        // export type ProofViewResult = ProofView & ProofViewTag & FocusPosition
        // export type InterruptedResult = CommandInterrupted & InterruptedTag & FocusPosition
        // export type CommandResult = NotRunningTag | FailureResult | ProofViewResult | InterruptedResult | NoProofResult
    }
    updateDiagnostics(now = false) {
        if (!this.isStmRunning())
            return;
        this.feedback.updateDiagnostics(() => {
            const diagnostics = [];
            for (let error of this.stm.getErrors()) {
                if (error.range) {
                    diagnostics.push(vscode_languageserver_1.Diagnostic.create(error.range, AnnotatedText_1.textToDisplayString(error.message), 1 /* Error */, undefined, 'coqtop'));
                }
                else {
                    diagnostics.push(vscode_languageserver_1.Diagnostic.create(error.sentence, AnnotatedText_1.textToDisplayString(error.message), 1 /* Error */, undefined, 'coqtop'));
                }
            }
            diagnostics.push(...Array.from(this.document.getErrors()));
            return diagnostics;
        }, now);
    }
    stepForward(token) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertStm();
            try {
                this.parsingRanges = [];
                const error = yield this.stm.stepForward(this.commandSequence(true));
                if (error)
                    return error;
                return this.toGoal(yield this.stm.getGoal());
            }
            finally {
                this.parsingRanges = [];
                this.updateHighlights(true);
                this.updateDiagnostics(true);
            }
        });
    }
    stepBackward(token) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertStm();
            try {
                const error = yield this.stm.stepBackward();
                if (error)
                    return error;
                return this.toGoal(yield this.stm.getGoal());
            }
            finally {
                this.updateHighlights(true);
                this.updateDiagnostics(true);
            }
        });
    }
    interpretToPoint(location, synchronous = false, token) {
        return __awaiter(this, void 0, void 0, function* () {
            this.assertStm();
            try {
                const pos = (typeof location === 'number') ? this.positionAt(location) : location;
                this.parsingRanges = [vscode_languageserver_1.Range.create(this.stm.getFocusedPosition(), pos)];
                this.updateHighlights(true);
                const error = yield this.stm.interpretToPoint(pos, this.commandSequence(false), this.project.settings.coq.interpretToEndOfSentence, synchronous, token);
                if (error)
                    return error;
                return this.toGoal(yield this.stm.getGoal());
            }
            finally {
                this.parsingRanges = [];
                this.updateHighlights(true);
                this.updateDiagnostics(true);
            }
        });
    }
    interpretToEnd(synchronous = false, token) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.interpretToPoint(this.document.getText().length, synchronous, token);
        });
    }
    getGoal() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return { type: 'not-running', reason: "not-started" };
            try {
                return this.toGoal(yield this.stm.getGoal());
            }
            finally {
                this.updateDiagnostics(true);
            }
        });
    }
    getCachedGoal(pos) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return { type: 'not-running', reason: "not-started" };
            try {
                return this.toGoal(yield this.stm.getCachedGoal(pos));
            }
            finally {
                this.updateDiagnostics(true);
            }
        });
    }
    getStatus(force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return { type: 'not-running', reason: "not-started" };
            try {
                return yield this.stm.getStatus(force);
            }
            finally {
                this.updateDiagnostics(true);
            }
        });
    }
    finishComputations() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isStmRunning())
                this.stm.finishComputations();
        });
    }
    locateIdent(ident) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return "Coq is not running";
            try {
                return yield this.stm.doQuery(`Locate ${ident}.`);
            }
            catch (err) {
                return yield this.stm.doQuery(`Locate "${ident}".`);
            }
        });
    }
    checkTerm(term) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return "Coq is not running";
            return yield this.stm.doQuery(`Check ${term}.`);
        });
    }
    printTerm(term) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return "Coq is not running";
            return yield this.stm.doQuery(`Print ${term}.`);
        });
    }
    search(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return "Coq is not running";
            return yield this.stm.doQuery(`Search ${query}.`);
        });
    }
    searchAbout(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return "Coq is not running";
            return yield this.stm.doQuery(`SearchAbout ${query}.`);
        });
    }
    setWrappingWidth(columns) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return;
            yield this.stm.setWrappingWidth(columns);
        });
    }
    requestLtacProfResults(offset) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return;
            yield this.stm.requestLtacProfResults(offset ? this.positionAt(offset) : undefined);
        });
    }
    interrupt() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return;
            this.stm.interrupt();
        });
    }
    quitCoq() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return;
            yield this.stm.shutdown();
            this.stm.dispose();
            this.stm = null;
        });
    }
    setDisplayOptions(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStmRunning())
                return;
            this.stm.setDisplayOptions(options);
        });
    }
    isStmRunning() {
        return this.stm && this.stm.isRunning();
    }
    provideSymbols() {
        try {
            const results = [];
            for (let sent of this.document.getSentences()) {
                results.push(...sent.getSymbols());
            }
            return results;
        }
        catch (err) {
            return [];
        }
    }
    provideDefinition(pos) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const symbols = this.document.lookupDefinition(pos);
                return symbols.map(s => vscode.Location.create(this.uri, s.symbol.range));
            }
            catch (err) {
                return [];
            }
        });
    }
    provideDocumentLinks(token) {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
            // if(!this.isStmRunning())
            //   return;
            // const results : vscode.DocumentLink[] = [];
            // for(let sent of this.stm.getSentences()) {
            //   sem: for(let sem of sent.getSemantics()) {
            //     if(sem instanceof sentSem.LoadModule) {
            //       if(!sem.getSourceFileName())
            //         continue sem;
            //       const link = new vscode.DocumentLink();
            //       link.range = sent.range;
            //       link.target = sem.getSourceFileName();
            //       results.push(link)
            //     }
            //   }
            // }
            // return results;
        });
    }
}
exports.CoqDocument = CoqDocument;
//# sourceMappingURL=document.js.map