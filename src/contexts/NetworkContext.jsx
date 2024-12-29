import { createContext, useContext, useState, useCallback } from 'react';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [networkState, setNetworkState] = useState({
    latency: 0,
    quality: 'good',
    isConnected: false,
    lastPing: Date.now()
  });

  const updateNetworkStats = useCallback((stats) => {
    setNetworkState(prev => ({
      ...prev,
      ...stats,
      lastPing: Date.now()
    }));
  }, []);

  return (
    <NetworkContext.Provider value={{ networkState, updateNetworkStats }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext); 