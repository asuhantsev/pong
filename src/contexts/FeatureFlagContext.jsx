import { createContext, useContext, useEffect, useState } from 'react';
import { featureFlags } from '../utils/featureFlags';
import Logger from '../utils/logger';

const FeatureFlagContext = createContext(null);

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState(featureFlags.getAllFlags());

  useEffect(() => {
    // Subscribe to flag changes
    const unsubscribe = featureFlags.subscribe(newFlags => {
      setFlags(newFlags);
      Logger.debug('FeatureFlagContext', 'Flags updated', newFlags);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    flags,
    isEnabled: flag => featureFlags.isEnabled(flag),
    setFlag: (flag, value) => featureFlags.setFlag(flag, value),
    resetFlags: () => featureFlags.resetFlags()
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
} 