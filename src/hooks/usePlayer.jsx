import { useContext } from 'react';
import { PlayerContext } from '../contexts/PlayerContext';

export function usePlayer() {
  const { nickname, updateNickname } = useContext(PlayerContext);

  return {
    nickname,
    updateNickname,
    isHost: false, // This will be updated when multiplayer functionality is implemented
    side: 'left',  // Default side, can be 'left' or 'right'
  };
} 