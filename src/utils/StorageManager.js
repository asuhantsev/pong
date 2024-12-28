import { NICKNAME_RULES } from '../constants/gameConstants';

const StorageManager = {
  saveNickname: (nickname) => {
    try {
      // Try cookies first
      document.cookie = `playerNickname=${nickname};max-age=${30*24*60*60};path=/`;
      return true;
    } catch (e) {
      // Fallback to sessionStorage
      try {
        sessionStorage.setItem('playerNickname', nickname);
        return true;
      } catch (e) {
        return false;
      }
    }
  },

  getNickname: () => {
    // Try cookie first
    const cookie = document.cookie.match(/playerNickname=([^;]+)/);
    if (cookie) return cookie[1];

    // Try sessionStorage
    const stored = sessionStorage.getItem('playerNickname');
    if (stored) return stored;

    // Return default
    return NICKNAME_RULES.DEFAULT;
  }
};

export default StorageManager; 