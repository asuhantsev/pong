import Logger from './logger';

// Define feature flag types for TypeScript-like validation
const FeatureFlags = {
  USE_NEW_PHYSICS: 'useNewPhysics',
  USE_NEW_GAME_LOOP: 'useNewGameLoop',
  USE_NEW_STATE_MANAGEMENT: 'useNewStateManagement',
  ENABLE_DEBUG_OVERLAY: 'enableDebugOverlay',
  ENABLE_PERFORMANCE_MONITORING: 'enablePerformanceMonitoring'
};

// Default values for features
const defaultFlags = {
  [FeatureFlags.USE_NEW_PHYSICS]: false,
  [FeatureFlags.USE_NEW_GAME_LOOP]: false,
  [FeatureFlags.USE_NEW_STATE_MANAGEMENT]: false,
  [FeatureFlags.ENABLE_DEBUG_OVERLAY]: import.meta.env.VITE_DEBUG === 'true',
  [FeatureFlags.ENABLE_PERFORMANCE_MONITORING]: import.meta.env.VITE_DEBUG === 'true'
};

class FeatureFlagManager {
  constructor() {
    this.flags = { ...defaultFlags };
    this.subscribers = new Set();
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        this.flags = { ...defaultFlags, ...JSON.parse(stored) };
        Logger.debug('FeatureFlagManager', 'Loaded flags from storage', this.flags);
      }
    } catch (error) {
      Logger.error('FeatureFlagManager', 'Failed to load flags from storage', error);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('featureFlags', JSON.stringify(this.flags));
      Logger.debug('FeatureFlagManager', 'Saved flags to storage', this.flags);
    } catch (error) {
      Logger.error('FeatureFlagManager', 'Failed to save flags to storage', error);
    }
  }

  isEnabled(flag) {
    return this.flags[flag] ?? defaultFlags[flag] ?? false;
  }

  setFlag(flag, value) {
    if (!(flag in FeatureFlags)) {
      Logger.warn('FeatureFlagManager', `Attempted to set unknown flag: ${flag}`);
      return;
    }

    this.flags[flag] = value;
    this.saveToStorage();
    this.notifySubscribers();
    Logger.info('FeatureFlagManager', `Feature flag "${flag}" set to ${value}`);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.flags));
  }

  getAllFlags() {
    return { ...this.flags };
  }

  resetFlags() {
    this.flags = { ...defaultFlags };
    this.saveToStorage();
    this.notifySubscribers();
    Logger.info('FeatureFlagManager', 'All flags reset to defaults');
  }
}

// Create and export a singleton instance
const featureFlags = new FeatureFlagManager();
export { featureFlags, FeatureFlags }; 