import Logger from './logger';
import { featureFlags, FeatureFlags } from './featureFlags';

class StateTracker {
  constructor() {
    this.stateHistory = [];
    this.maxHistoryLength = 50; // Keep last 50 state changes
    this.subscribers = new Set();
  }

  // Track a state change
  trackChange(component, prevState, nextState, action = null) {
    if (!featureFlags.isEnabled(FeatureFlags.ENABLE_DEBUG_OVERLAY)) return;

    const timestamp = new Date().toISOString();
    const change = {
      timestamp,
      component,
      action,
      changes: this.diffState(prevState, nextState),
      prevState: this.cloneState(prevState),
      nextState: this.cloneState(nextState)
    };

    this.stateHistory.push(change);
    if (this.stateHistory.length > this.maxHistoryLength) {
      this.stateHistory.shift();
    }

    Logger.debug('StateTracker', `State changed in ${component}`, {
      action,
      changes: change.changes
    });

    this.notifySubscribers(change);
  }

  // Compare two state objects and return differences
  diffState(prev, next) {
    const changes = {};
    const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

    for (const key of allKeys) {
      if (prev[key] !== next[key]) {
        changes[key] = {
          from: prev[key],
          to: next[key]
        };
      }
    }

    return changes;
  }

  // Safely clone state (handling circular references)
  cloneState(state) {
    try {
      return JSON.parse(JSON.stringify(state));
    } catch (error) {
      Logger.warn('StateTracker', 'Failed to clone state', error);
      return { error: 'State contained non-serializable values' };
    }
  }

  // Subscribe to state changes
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify subscribers of state changes
  notifySubscribers(change) {
    this.subscribers.forEach(callback => callback(change));
  }

  // Get all tracked changes
  getHistory() {
    return [...this.stateHistory];
  }

  // Clear history
  clearHistory() {
    this.stateHistory = [];
    Logger.debug('StateTracker', 'State history cleared');
  }

  // Get the last n changes
  getLastChanges(n = 1) {
    return this.stateHistory.slice(-n);
  }
}

// Create and export singleton instance
const stateTracker = new StateTracker();
export default stateTracker; 