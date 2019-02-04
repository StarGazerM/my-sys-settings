function importStyles(doc) {
    var parentStyleSheets = doc.styleSheets;
    var cssString = "";
    for (var i = 0, count = parentStyleSheets.length; i < count; ++i) {
        if (parentStyleSheets[i].cssRules) {
            var cssRules = parentStyleSheets[i].cssRules;
            for (var j = 0, countJ = cssRules.length; j < countJ; ++j)
                cssString += cssRules[j].cssText;
        }
        else
            cssString += parentStyleSheets[i].cssText; // IE8 and earlier
    }
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = cssString;
    // message(cssString);
    document.getElementsByTagName("head")[0].appendChild(style);
}
function inheritStyles(p) {
    if (p) {
        importStyles(p.document);
        const pp = p.parent;
        if (pp !== p)
            inheritStyles(pp);
    }
}
function makeBreakingText(text) {
    var txt = 
    // document.createTextNode(Array.prototype.map.call(text, (c) => /[\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/.test(c) ? ' ' : c).join(''));
    document.createTextNode(text.replace(/[\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/g, ' '));
    //);
    // txt.ondblclick = onDoubleClickBreakableText;
    return [txt];
}
var HypothesisDifference;
(function (HypothesisDifference) {
    HypothesisDifference[HypothesisDifference["None"] = 0] = "None";
    HypothesisDifference[HypothesisDifference["Changed"] = 1] = "Changed";
    HypothesisDifference[HypothesisDifference["New"] = 2] = "New";
    HypothesisDifference[HypothesisDifference["MovedUp"] = 3] = "MovedUp";
    HypothesisDifference[HypothesisDifference["MovedDown"] = 4] = "MovedDown";
})(HypothesisDifference || (HypothesisDifference = {}));
/// <reference path="../../typings/index.d.ts" />
/// <reference path="./ui-util.ts" />
/// <reference path="./protocol.ts" />
var DisplayState;
(function (DisplayState) {
    DisplayState[DisplayState["Proof"] = 0] = "Proof";
    DisplayState[DisplayState["Top"] = 1] = "Top";
    DisplayState[DisplayState["Error"] = 2] = "Error";
    DisplayState[DisplayState["NotRunning"] = 3] = "NotRunning";
    DisplayState[DisplayState["NoProof"] = 4] = "NoProof";
    DisplayState[DisplayState["Interrupted"] = 5] = "Interrupted";
})(DisplayState || (DisplayState = {}));
function getDisplayState(state) {
    switch (state.type) {
        case 'failure':
            return DisplayState.Error;
        case 'proof-view':
            return DisplayState.Proof;
        case 'not-running':
            return DisplayState.NotRunning;
        case 'no-proof':
            return DisplayState.NoProof;
        case 'interrupted':
            return DisplayState.Interrupted;
    }
}
function countUnfocusedGoals(u) {
    if (!u)
        return 0;
    return u.before.length + u.after.length + countUnfocusedGoals(u.next);
}
function countAllGoals(state) {
    const result = (state.goals ? state.goals.length : 0)
        + countUnfocusedGoals(state.backgroundGoals)
        + (state.abandonedGoals ? state.abandonedGoals.length : 0)
        + (state.shelvedGoals ? state.shelvedGoals.length : 0);
    return result;
}
function getDifferenceClass(diff) {
    switch (diff) {
        case HypothesisDifference.Changed:
            return ' changed';
        case HypothesisDifference.New:
            return ' new';
        case HypothesisDifference.MovedUp:
            return ' movedUp';
        case HypothesisDifference.MovedDown:
            return ' movedDown';
        default:
            return '';
    }
}
function getTextDiffClass(diff) {
    if (diff === "added")
        return 'charsAdded';
    if (diff === "removed")
        return 'charsRemoved';
    else
        return '';
}
function isScopedText(text) {
    return text.hasOwnProperty('scope');
}
let hasSubstitutions = false;
function createAnnotatedText(text) {
    function helper(text) {
        if (typeof text === 'string')
            return makeBreakingText(text);
        else if (text instanceof Array)
            return Array.prototype.concat(...text.map(helper));
        else if (isScopedText(text))
            return text.scope.trim() !== ""
                ? [$('<span>')
                        .addClass(text.scope.replace('.', '-'))
                        .append(helper(text.text))
                        .get(0)]
                : helper(text.text);
        else if (text.substitution) {
            hasSubstitutions = true;
            return [$('<span>')
                    .addClass('substitution')
                    .addClass(getTextDiffClass(text.diff))
                    .attr("subst", text.substitution)
                    .attr("title", text.text)
                    .append(makeBreakingText(text.text))
                    .get(0)];
        }
        else
            return [$('<span>')
                    .addClass(getTextDiffClass(text.diff))
                    .append(makeBreakingText(text.text))
                    .get(0)];
    }
    return [$('<span>')
            .addClass('richpp')
            .append(helper(text))
            .get(0)];
}
function onDoubleClickBreakableText(event) {
    var target = event.currentTarget;
    if ($(event.currentTarget).hasClass('hypothesis')) {
        $(event.currentTarget).toggleClass('breakText');
        $(event.currentTarget).toggleClass('noBreakText');
    }
}
function createHypothesis(hyp) {
    return $('<li>')
        .addClass('hypothesis')
        .addClass('breakText')
        .addClass(getDifferenceClass(hyp.diff))
        .append([$('<span>').addClass('ident').text(hyp.identifier),
        $('<span>').addClass('rel').text(hyp.relation),
        $('<span>').addClass('expr')
            .append($(createAnnotatedText(hyp.expression)))
    ])
        .on('dblclick', onDoubleClickBreakableText);
}
function createHypotheses(hyps) {
    return $('<ul>')
        .addClass('hypotheses')
        .append(hyps.map((hyp) => createHypothesis(hyp)));
}
function createGoal(goal, idx, count) {
    let expr = $('<span>').addClass('expr');
    expr.append($(createAnnotatedText(goal.goal)));
    return $('<li>')
        .addClass('goal')
        .append([$('<span>').addClass('goalId').text(`${idx + 1}/${count}`),
        $('<span>').addClass('error'),
        expr
    ]);
}
function createGoals(goals) {
    return $('<ul>')
        .addClass('goalsLists')
        .append(goals.map((g, i) => createGoal(g, i, goals.length)));
}
function createFocusedGoals(goals) {
    return $('<ul>')
        .addClass('goalsList')
        .append(goals.map((g, i) => createGoal(g, i, goals.length)));
    // return $(goals.map((g,idx) =>
    //   createGoal(g, idx, goals.length)));
}
class StateModel {
    constructor() {
        this.focusedState = 0;
    }
    setMessage(message) {
        $('#messages').text(message);
    }
    setErrorMessage(message) {
        if (typeof message === 'string')
            $('#error').text(message);
        else {
            $('#error').append($(createAnnotatedText(message)));
        }
    }
    clearErrorMessage() {
        $('#error').empty();
    }
    updateState(state) {
        try {
            hasSubstitutions = false;
            this.focusedState = 0;
            this.clearErrorMessage();
            $('#stdout').text('');
            if (state.type === 'failure')
                this.setErrorMessage(state.message);
            else if (state.type === 'not-running')
                this.setMessage('Not running.');
            else if (state.type === 'no-proof')
                this.setMessage('Not in proof mode.');
            else if (state.type === 'interrupted')
                this.setMessage("Interrupted.");
            else if (state.type === 'proof-view') {
                if (countAllGoals(state) == 0) {
                    $('#states').empty();
                    this.setMessage("No more subgoals.");
                }
                else if (state.goals) {
                    if (state.goals.length > 0) {
                        this.setMessage("");
                        $('#states')
                            .empty()
                            .append([createHypotheses(state.goals[0].hypotheses),
                            createFocusedGoals(state.goals)
                        ]);
                    }
                    else {
                        $('#states').empty();
                        this.setMessage("There are unfocused goals.");
                    }
                }
                if (hasSubstitutions)
                    $('#togglePrettifySymbols').removeClass("hidden");
                else
                    $('#togglePrettifySymbols').addClass("hidden");
            }
        }
        catch (err) {
            this.setMessage(err);
        }
    }
}
StateModel.hypothesesNodeClass = '.hypotheses';
StateModel.goalNodeClass = '.goal';
StateModel.focusedStateClass = '.focusedState';
/// <reference path="../../typings/index.d.ts" />
/// <reference path="./ui-util.ts" />
/// <reference path="./StateModel.ts" />
/// <reference path="./protocol.ts" />
function getQueryStringValue(key) {
    return decodeURI(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURI(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}
const stateModel = new StateModel();
var throttleTimeout = null;
var throttleTimeoutCount = 0;
var throttleEventHandler = (handler) => (event) => {
    throttleTimeoutCount = (throttleTimeoutCount + 1) % 10;
    if (throttleTimeoutCount == 1)
        handler(event);
    else if (!throttleTimeout) {
        clearTimeout(throttleTimeout);
        throttleTimeout = setTimeout(() => {
            throttleTimeout = null;
            handler(event);
        }, 500);
    }
    // handler(event);
    // throttleTimeout = setTimeout(() => {
    //   throttleTimeout = null;
    //   // handler(event);
    // }, 10);
};
function computePrintingWidth() {
    try {
        const stateView = $('#states')[0];
        const ctx = $('#textMeasurer')[0].getContext("2d");
        ctx.font = getComputedStyle($('#textMeasurer')[0]).font;
        let widthChars = Math.floor(stateView.clientWidth / ctx.measureText("O").width);
        if (widthChars === Number.POSITIVE_INFINITY)
            widthChars = 1;
        widthChars = Math.max(widthChars, 5);
        $('#measureTest').text("<" + "-".repeat(widthChars - 2) + ">");
        if (connection)
            connection.send(JSON.stringify({
                eventName: 'resize',
                params: { columns: widthChars }
            }));
    }
    catch (error) {
        $('#stdout').text("!" + error);
    }
}
function onWindowGetFocus(event) {
    try {
        if (connection)
            connection.send(JSON.stringify({
                eventName: 'focus',
                params: {}
            }));
    }
    catch (error) {
    }
}
function getVSCodeTheme() {
    switch ($(parent.document.body).attr('class')) {
        case 'vscode-dark': return 'vscode-dark';
        case 'vscode-light': return 'vscode-light';
        case 'vscode-high-contrast': return 'vscode-high-contrast';
        default:
            return '';
    }
}
const observer = new MutationObserver(function (mutations) {
    inheritStyles(parent.parent);
    $(document.body).attr('class', getVSCodeTheme());
    // mutations.forEach(function(mutationRecord) {
    //   console.log(`{name: ${mutationRecord.attributeName}, old: ${mutationRecord.oldValue}, new: ${$(mutationRecord.target).attr('class')} }`);
    // });    
});
function togglePrettifySymbolsMode() {
    $(document.body)
        .toggleClass("prettifySymbolsMode");
}
var connection = null;
function load() {
    if (parent.parent === parent) {
        $(document.body).css({ backgroundColor: 'black' });
    }
    else {
        try {
            window.onresize = throttleEventHandler(event => computePrintingWidth);
            window.addEventListener("focus", onWindowGetFocus, true);
            observer.observe(parent.document.body, { attributes: true, attributeFilter: ['class'] });
            inheritStyles(parent.parent);
            $(document.body)
                .removeClass("vscode-dark")
                .removeClass("vscode-light")
                .addClass(getVSCodeTheme());
        }
        catch (error) {
            $('#stdout').text(error.toString());
            $('#error').text(error.toString());
            return;
        }
    }
    const address = `ws://${getQueryStringValue('host')}:${getQueryStringValue('port')}`;
    connection = new WebSocket(address);
    connection.onopen = function (event) {
        $('#stdout').text("connected");
    };
    connection.onclose = function (event) {
        $('#stdout').text("connection closed");
    };
    connection.onerror = function (event) {
        $('#stdout').text("connection error");
    };
    connection.onmessage = function (event) {
        const message = JSON.parse(event.data);
        handleMessage(message);
    };
    computePrintingWidth();
}
let currentCSSNode = null;
function loadCSS(filename) {
    // ref: http://stackoverflow.com/questions/9979415/dynamically-load-and-unload-stylesheets
    unloadCSS();
    var head = document.getElementsByTagName("head")[0];
    currentCSSNode = document.createElement('link');
    currentCSSNode.type = 'text/css';
    currentCSSNode.rel = 'stylesheet';
    currentCSSNode.media = 'screen';
    currentCSSNode.href = filename;
    head.appendChild(currentCSSNode);
}
function unloadCSS() {
    if (!currentCSSNode)
        return;
    var head = document.getElementsByTagName("head")[0];
    head.removeChild(currentCSSNode);
}
function updateSettings(settings) {
    if (settings.fontFamily)
        document.documentElement.style.setProperty(`--code-font-family`, settings.fontFamily);
    if (settings.fontSize)
        document.documentElement.style.setProperty(`--code-font-size`, settings.fontSize);
    if (settings.fontWeight)
        document.documentElement.style.setProperty(`--code-font-weight`, settings.fontWeight);
    if (settings.cssFile)
        loadCSS(settings.cssFile);
    computePrintingWidth();
}
function handleMessage(message) {
    switch (message.command) {
        case 'goal-update':
            return stateModel.updateState(message.goal);
        case 'settings-update':
            updateSettings(message);
    }
}

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9nb2Fscy91aS11dGlsLnRzIiwic3JjL2dvYWxzL3Byb3RvY29sLnRzIiwic3JjL2dvYWxzL1N0YXRlTW9kZWwudHMiLCJzcmMvZ29hbHMvbW9kZWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0Esc0JBQXNCLEdBQUc7SUFDdkIsSUFBSSxpQkFBaUIsR0FBb0IsR0FBRyxDQUFDLFdBQVcsQ0FBQztJQUN6RCxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7SUFDbkIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2pFLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDbEMsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO1lBQzdDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLEVBQUUsQ0FBQztnQkFDdkQsU0FBUyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDckMsQ0FBQztRQUNELElBQUk7WUFDRixTQUFTLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUUsa0JBQWtCO0lBQ2xFLENBQUM7SUFDRCxJQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzVDLEtBQUssQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0lBQ3hCLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzVCLHNCQUFzQjtJQUN0QixRQUFRLENBQUMsb0JBQW9CLENBQUMs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ckIsUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLG9CQUFvQixFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN4RixFQUFFLENBQUEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQ25CLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDcEYsRUFBRSxDQUFBLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQztRQUNyQixRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsb0JBQW9CLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3hGLEVBQUUsQ0FBQSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7UUFDbEIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU1QixvQkFBb0IsRUFBRSxDQUFDO0FBQ3pCLENBQUM7QUFFRCx1QkFBdUIsT0FBMEI7SUFDL0MsTUFBTSxDQUFBLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdkIsS0FBSyxhQUFhO1lBQ2hCLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QyxLQUFLLGlCQUFpQjtZQUNwQixjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDNUIsQ0FBQztBQUNILENBQUMiLCJmaWxlIjoiZ29hbHMuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGxdLCJzb3VyY2VSb290IjoiL2h0bWxfdmlld3MifQ==
