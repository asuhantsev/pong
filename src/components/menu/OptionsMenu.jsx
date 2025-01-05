import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayerContext } from '../../contexts/PlayerContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from '../../styles/components/menu/OptionsMenu.module.css';
import Logger from '../../utils/logger';
import StorageManager from '../../utils/StorageManager';

export function OptionsMenu() {
  const navigate = useNavigate();
  const { updateNickname } = useContext(PlayerContext);
  const { theme } = useTheme();
  const [nickname, setNickname] = useState(StorageManager.getNickname() || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!nickname.trim()) {
      setError('Nickname cannot be empty');
      return;
    }

    try {
      StorageManager.saveNickname(nickname.trim());
      
      if (updateNickname) {
        updateNickname(nickname.trim());
      }

      Logger.info('OptionsMenu', 'Saving nickname', { nickname });
      navigate('/');
    } catch (error) {
      Logger.error('OptionsMenu', 'Failed to save nickname', { error });
      setError('Failed to save nickname');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.menuContainer} ${styles[theme]}`}>
        <h1 className={styles.title}>Options</h1>
        
        <div className={styles.nicknameSection}>
          <label htmlFor="nickname" className={styles.label}>
            Nickname
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError('');
            }}
            className={`${styles.input} ${error ? styles.error : ''}`}
            placeholder="Enter your nickname"
          />
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
        
        <div className={styles.buttonContainer}>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleBack}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
} 