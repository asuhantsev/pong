import { createContext, useState, useCallback } from 'react';
import StorageManager from '../utils/StorageManager';

export const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [nickname, setNickname] = useState(StorageManager.getNickname() || 'Player');

  const updateNickname = useCallback((newNickname) => {
    if (!newNickname) return;
    setNickname(newNickname);
    StorageManager.saveNickname(newNickname);
  }, []);

  return (
    <PlayerContext.Provider value={{ nickname, updateNickname }}>
      {children}
    </PlayerContext.Provider>
  );
} 