import { NICKNAME_RULES } from '../constants/gameConstants';

class StorageManager {
  static saveNickname(nickname) {
    try {
      document.cookie = `playerNickname=${nickname}; SameSite=Strict; Secure; path=/`;
      localStorage.setItem('playerNickname', nickname);
    } catch (error) {
      console.warn('Failed to save nickname:', error);
      // Fallback to session storage
      sessionStorage.setItem('playerNickname', nickname);
    }
  }

  static getNickname() {
    try {
      // Try to get from cookie first
      const cookieMatch = document.cookie.match(/playerNickname=([^;]+)/);
      if (cookieMatch) return cookieMatch[1];
      
      // Try localStorage next
      const localNickname = localStorage.getItem('playerNickname');
      if (localNickname) return localNickname;
      
      // Try sessionStorage as fallback
      const sessionNickname = sessionStorage.getItem('playerNickname');
      if (sessionNickname) return sessionNickname;
      
      return 'Player';
    } catch (error) {
      console.warn('Failed to get nickname:', error);
      return 'Player';
    }
  }
}

export default StorageManager; 