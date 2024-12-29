import { useState } from 'react';
import styles from '../styles/components/ThemeToggle.module.css';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };

  return (
    <button 
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
} 