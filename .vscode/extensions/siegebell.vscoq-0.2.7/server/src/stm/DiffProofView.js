// 'use strict';
"use strict";
const protocol_1 = require('../protocol');
const text = require('../util/AnnotatedText');
const server = require('../server');
function diffHypotheses(oldHyps, newHyps) {
    const results = [];
    newHyps.forEach((hyp, idxHyp) => {
        let oldHypIdx = idxHyp;
        let oldHyp = oldHyps[oldHypIdx];
        if (oldHyp === undefined || oldHyp.identifier !== hyp.identifier) {
            oldHypIdx = oldHyps.findIndex((h) => h.identifier === hyp.identifier);
            oldHyp = oldHyps[oldHypIdx];
        }
        if (oldHyp === undefined)
            results.push({ diff: protocol_1.HypothesisDifference.New, expression: hyp.expression, identifier: hyp.identifier, relation: hyp.relation });
        else {
            const diff = text.diffText(oldHyp.expression, hyp.expression);
            results.push({
                diff: diff.different ? protocol_1.HypothesisDifference.Changed : protocol_1.HypothesisDifference.None,
                expression: diff.text,
                identifier: hyp.identifier,
                relation: hyp.relation });
        }
    });
    return results;
}
function diffGoal(oldGoal, newGoal) {
    if (oldGoal.id === newGoal.id)
        return newGoal;
    return {
        hypotheses: diffHypotheses(oldGoal.hypotheses, newGoal.hypotheses),
        goal: text.diffText(oldGoal.goal, newGoal.goal).text,
        id: newGoal.id
    };
}
function diffGoals(oldGoals, newGoals) {
    if (!newGoals || !oldGoals || oldGoals.length <= 0)
        return newGoals;
    // console.log(`[${oldGoals.map(g=>g.id).join(',')}] --> [${newGoals.map(g=>g.id).join(',')}]`);
    const results = [];
    const old = oldGoals.filter(o => newGoals.findIndex(n => n.id === o.id) === -1);
    let oIdx = 0;
    for (let nIdx = 0; nIdx < newGoals.length; ++nIdx) {
        const hyp = newGoals[nIdx];
        let o = oldGoals.findIndex(g => g.id === hyp.id);
        if (o >= 0 || !old[oIdx]) {
            results.push(hyp);
        }
        else {
            results.push(diffGoal(old[oIdx], hyp));
            ++oIdx;
        }
    }
    // newGoals.forEach((g,idxGoal) => {
    //   if(oldGoals[idxGoal] !== undefined)
    //     results.push(diffGoal(oldGoals[idxGoal], g));
    // })
    return results;
}
function diffProofView(oldState, newState) {
    try {
        return {
            goals: diffGoals(oldState.goals, newState.goals),
            abandonedGoals: newState.abandonedGoals,
            backgroundGoals: newState.backgroundGoals,
            shelvedGoals: newState.shelvedGoals,
        };
    }
    catch (err) {
        server.connection.console.error('diffGoals threw an exception: ' + err.toString());
        return newState;
    }
}
exports.diffProofView = diffProofView;
//# sourceMappingURL=DiffProofView.js.map