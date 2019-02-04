"use strict";
class FeedbackSync {
    constructor(callbacks, delayMS = 500) {
        this.callbacks = callbacks;
        this.delayMS = delayMS;
        this.focus = null;
        this.diagnostics = null;
        this.highlights = null;
        this.feedbackTimeout = null;
        this.busy = false;
    }
    sendFeedbackNow() {
        this.busy = true;
        if (this.focus !== null)
            this.callbacks.sendStmFocus(this.focus);
        if (this.diagnostics)
            this.callbacks.sendDiagnostics(this.diagnostics());
        if (this.highlights)
            this.callbacks.sendHighlightUpdates(this.highlights());
        this.focus = null;
        this.diagnostics = null;
        this.highlights = null;
        this.busy = false;
    }
    sendFeedbackLazily() {
        if (this.feedbackTimeout !== null)
            return;
        this.feedbackTimeout = setTimeout(() => {
            this.feedbackTimeout = null;
            this.sendFeedbackNow();
        }, this.delayMS);
    }
    cancelSync() {
        if (this.feedbackTimeout !== null)
            clearTimeout(this.feedbackTimeout);
    }
    syncNow() {
        this.cancelSync();
        this.sendFeedbackNow();
    }
    updateFocus(focus, now = true) {
        this.focus = focus;
        if (now)
            this.sendFeedbackNow();
        else
            this.sendFeedbackLazily();
    }
    updateHighlights(highlights, now = true) {
        this.highlights = highlights;
        if (now)
            this.sendFeedbackNow();
        else
            this.sendFeedbackLazily();
    }
    updateDiagnostics(diagnostics, now = true) {
        this.diagnostics = diagnostics;
        if (now)
            this.sendFeedbackNow();
        else
            this.sendFeedbackLazily();
    }
}
exports.FeedbackSync = FeedbackSync;
//# sourceMappingURL=FeedbackSync.js.map