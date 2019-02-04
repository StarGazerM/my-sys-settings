"use strict";
/** Manages the status bar at the bottom of vscode. All Coq documents should go through this module
 *
 */
const vscode = require('vscode');
const proto = require('./protocol');
const textUtil = require('./text-util');
class CoqStatusBarManager {
    constructor() {
        this.computingTimer = null;
        this.showingComputingTimeStatus = false;
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 3);
        this.statusBar.text = 'Loading Coq';
        this.statusBar.show();
        this.computingStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
        this.computingStatusBar.tooltip = 'Time elapsed on the current computation';
        this.computingStatusBar.text = '';
        this.interruptButtonStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        this.interruptButtonStatusBar.tooltip = 'Interrupt Coq computation';
        this.interruptButtonStatusBar.color = 'rgba(255,100,100,1)';
        this.interruptButtonStatusBar.command = 'extension.coq.interrupt';
        this.interruptButtonStatusBar.text = '$(primitive-square)';
    }
    dispose() {
        this.interruptButtonStatusBar.dispose();
        this.computingStatusBar.dispose();
        this.statusBar.dispose();
        if (this.computingTimer)
            clearInterval(this.computingTimer);
        this.computingTimer = null;
    }
    showState(state) {
        this.statusBar.show();
        if (this.computingTimer && (state.status != "computing" || state.computeStatus !== proto.ComputingStatus.Computing)) {
            clearInterval(this.computingTimer);
            this.computingTimer = null;
            this.showingComputingTimeStatus = false;
        }
        switch (state.status) {
            case "ready": {
                this.statusBar.text = 'Ready';
                this.interruptButtonStatusBar.hide();
                this.computingStatusBar.hide();
                break;
            }
            case "message": {
                const state_ = state;
                this.computingStatusBar.hide();
                this.interruptButtonStatusBar.hide();
                this.statusBar.text = state_.message;
                break;
            }
            case "computing": {
                this.statusBar.text = state.message;
                switch (state.computeStatus) {
                    case proto.ComputingStatus.Finished:
                        this.computingStatusBar.hide();
                        this.interruptButtonStatusBar.hide();
                        break;
                    case proto.ComputingStatus.Computing:
                        if (!this.computingTimer)
                            this.computingTimer = setInterval(() => this.setComputeMS(state.updateTime()), 500);
                        this.setComputeMS(state.computeTimeMS);
                        break;
                    case proto.ComputingStatus.Interrupted:
                        this.computingStatusBar.text = `[Interrupted $(watch) ${textUtil.formatTimeSpanMS(state.computeTimeMS)}]`;
                        this.computingStatusBar.show();
                        this.interruptButtonStatusBar.hide();
                        break;
                }
                break;
            }
        }
    }
    setComputeMS(timeMS) {
        if (timeMS > 2000) {
            this.computingStatusBar.text = `[${textUtil.formatTimeSpanMS(timeMS)}]`;
            if (!this.showingComputingTimeStatus) {
                this.showingComputingTimeStatus = true;
                this.computingStatusBar.show();
                this.interruptButtonStatusBar.show();
            }
        }
        else {
            this.computingStatusBar.text = '';
            if (this.showingComputingTimeStatus) {
                this.showingComputingTimeStatus = false;
                this.computingStatusBar.hide();
                this.interruptButtonStatusBar.hide();
            }
        }
    }
    hide() {
        this.computingStatusBar.hide();
        this.interruptButtonStatusBar.hide();
        this.statusBar.hide();
    }
}
class StatusBar {
    constructor() {
        this.state = { status: "ready" };
        this.hidden = false;
        if (StatusBar.manager == null)
            StatusBar.manager = new CoqStatusBarManager();
        ++StatusBar.managerReferenceCount;
    }
    dispose() {
        --StatusBar.managerReferenceCount;
        if (StatusBar.managerReferenceCount == 0) {
            StatusBar.manager.hide();
            StatusBar.manager.dispose();
            StatusBar.manager = null;
        }
    }
    focus() {
        if (StatusBar.focusedContext !== this) {
            StatusBar.focusedContext = this;
            this.refreshState();
        }
    }
    unfocus() {
        if (StatusBar.focusedContext == this) {
            StatusBar.focusedContext = null;
            StatusBar.manager.hide();
        }
    }
    currentMessage() {
        if (this.state.status === "message" || this.state.status === "computing")
            return this.state.message;
        else
            return "";
    }
    setStateComputing(computeStatus, message) {
        let startTime;
        let computeTime = 0;
        if (this.state.status !== 'computing' || (computeStatus === proto.ComputingStatus.Computing && this.state.computeStatus !== computeStatus))
            startTime = process.hrtime();
        else {
            startTime = this.state.startTime;
            computeTime = this.state.computeTimeMS;
        }
        this.state =
            { status: 'computing',
                message: message ? message : this.state.status === 'computing' ? this.state.message : "",
                startTime: startTime,
                computeTimeMS: computeTime,
                computeStatus: computeStatus,
                updateTime: () => {
                    if (this.state.status != "computing" || this.state.computeStatus !== proto.ComputingStatus.Computing)
                        return;
                    const delta = process.hrtime(this.state.startTime);
                    this.state.computeTimeMS = delta[0] * 1000.0 + (delta[1] / 1000000.0);
                    return this.state.computeTimeMS;
                } };
        this.refreshState();
    }
    setStateReady() {
        this.state = { status: 'ready' };
        this.refreshState();
    }
    setStateWorking(name) {
        this.setStateComputing(proto.ComputingStatus.Computing, name);
    }
    setStateMessage(name) {
        this.state = { status: 'message', message: name };
    }
    refreshState() {
        if (StatusBar.focusedContext == this && !this.hidden)
            StatusBar.manager.showState(this.state);
    }
    show() {
        this.hidden = false;
        this.refreshState();
    }
    hide() {
        if (!this.hidden) {
            this.hidden = true;
            if (StatusBar.focusedContext == this)
                StatusBar.manager.hide();
        }
    }
}
StatusBar.manager = null;
StatusBar.managerReferenceCount = 0;
StatusBar.focusedContext = null;
exports.StatusBar = StatusBar;
//# sourceMappingURL=StatusBar.js.map