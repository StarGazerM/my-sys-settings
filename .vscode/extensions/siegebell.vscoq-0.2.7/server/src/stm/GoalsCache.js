"use strict";
/**
 * Caches goals, which can be shared between many STM states.
 *
 * TODO: use reference counting to deallocate goals when all of their states are rewound
 */
class GoalsCache {
    constructor() {
        this.goalsCache = new Map();
    }
    cacheUnfocusedGoals(goals) {
        if (!goals)
            return;
        goals.before.forEach(g => this.goalsCache.set(g.id, g));
        goals.after.forEach(g => this.goalsCache.set(g.id, g));
        this.cacheUnfocusedGoals(goals.next);
    }
    cacheProofView(pv) {
        function getUnfocusedIds(goals) {
            if (!goals)
                return null;
            return {
                before: goals.before.map(g => g.id),
                after: goals.after.map(g => g.id),
                next: getUnfocusedIds(goals.next),
            };
        }
        pv.goals.forEach(g => this.goalsCache.set(g.id, g));
        pv.abandonedGoals.forEach(g => this.goalsCache.set(g.id, g));
        pv.shelvedGoals.forEach(g => this.goalsCache.set(g.id, g));
        this.cacheUnfocusedGoals(pv.backgroundGoals);
        return {
            goals: pv.goals.map(g => g.id),
            abandonedGoals: pv.abandonedGoals.map(g => g.id),
            shelvedGoals: pv.shelvedGoals.map(g => g.id),
            backgroundGoals: getUnfocusedIds(pv.backgroundGoals),
        };
    }
    getBackgroundGoals(state) {
        if (!state)
            return null;
        else
            return {
                before: state.before.map(id => this.goalsCache.get(id)),
                after: state.after.map(id => this.goalsCache.get(id)),
                next: this.getBackgroundGoals(state.next)
            };
    }
    getProofView(state) {
        return {
            goals: state.goals.map(id => this.goalsCache.get(id)),
            abandonedGoals: state.abandonedGoals.map(id => this.goalsCache.get(id)),
            shelvedGoals: state.shelvedGoals.map(id => this.goalsCache.get(id)),
            backgroundGoals: this.getBackgroundGoals(state.backgroundGoals),
        };
    }
}
exports.GoalsCache = GoalsCache;
//# sourceMappingURL=GoalsCache.js.map