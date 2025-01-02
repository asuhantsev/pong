import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import styles from '../../styles/components/menu/OptionsMenu.module.css';

export function OptionsMenu() {
  const navigate = useNavigate();
  const { nickname: currentNickname, updateNickname } = useMultiplayer();
  const [nickname, setNickname] = useState(currentNickname);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!nickname.trim()) {
      setError('Nickname cannot be empty');
      return;
    }
    
    if (nickname.length < 3) {
      setError('Nickname must be at least 3 characters long');
      return;
    }

    updateNickname(nickname);
    setIsSaved(true);
    setError('');

    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Options</h2>

      <div className={styles.nicknameSection}>
        <label className={styles.label} htmlFor="nickname">
          Nickname
        </label>
        <input
          id="nickname"
          type="text"
          className={styles.input}
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError('');
            setIsSaved(false);
          }}
          maxLength={15}
        />
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.buttonContainer}>
        <button
          className={`${styles.saveButton} ${isSaved ? styles.saved : ''}`}
          onClick={handleSave}
          disabled={nickname === currentNickname || !nickname.trim()}
        >
          {isSaved ? 'Saved!' : 'Save Changes'}
        </button>
        <button className={styles.backButton} onClick={handleBack}>
          Back to Menu
        </button>
      </div>
    </div>
  );
} 