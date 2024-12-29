import styles from '../../../styles/components/game/ui/ScoreBoard.module.css';
import layoutStyles from '../../../styles/components/shared/Layout.module.css';
import themeStyles from '../../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../../styles/components/shared/Typography.module.css';
import spacingStyles from '../../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../../styles/components/shared/Animation.module.css';

export function ScoreBoard({ player1Score, player2Score, player1Name, player2Name }) {
  return (
    <div className={`
      ${layoutStyles.flexRow} 
      ${layoutStyles.justifyBetween} 
      ${spacingStyles.mb4}
      ${animationStyles.fadeIn}
    `}>
      <div className={`
        ${styles.scoreContainer} 
        ${themeStyles.glass}
        ${spacingStyles.p3}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
      `}>
        <div className={`${typographyStyles.text} ${styles.playerName}`}>
          {player1Name || 'Player 1'}
        </div>
        <div className={`${typographyStyles.heading2} ${styles.score}`}>
          {player1Score}
        </div>
      </div>

      <div className={`
        ${styles.scoreContainer} 
        ${themeStyles.glass}
        ${spacingStyles.p3}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
      `}>
        <div className={`${typographyStyles.text} ${styles.playerName}`}>
          {player2Name || 'Player 2'}
        </div>
        <div className={`${typographyStyles.heading2} ${styles.score}`}>
          {player2Score}
        </div>
      </div>
    </div>
  );
} 