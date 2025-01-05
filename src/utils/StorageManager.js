import { NICKNAME_RULES } from '../constants/gameConstants';

class StorageManager {
  static STORAGE_KEYS = {
    NICKNAME: 'pong_nickname',
    THEME: 'pong_theme',
    SETTINGS: 'pong_settings'
  };

  static getNickname() {
    return localStorage.getItem(this.STORAGE_KEYS.NICKNAME) || '';
  }

  static saveNickname(nickname) {
    if (!nickname) return;
    localStorage.setItem(this.STORAGE_KEYS.NICKNAME, nickname);
  }

  static getTheme() {
    return localStorage.getItem(this.STORAGE_KEYS.THEME) || 'dark';
  }

  static saveTheme(theme) {
    if (!theme) return;
    localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
  }
}

export default StorageManager; 