import styles from '../../styles/components/menu/OptionsMenu.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import themeStyles from '../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../styles/components/shared/Typography.module.css';
import buttonStyles from '../../styles/components/shared/Button.module.css';
import spacingStyles from '../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../styles/components/shared/Animation.module.css';

export function OptionsMenu({ options, onOptionChange, onBack }) {
  return (
    <div className={`
      ${layoutStyles.flexColumn}
      ${layoutStyles.itemsCenter}
      ${layoutStyles.justifyCenter}
      ${layoutStyles.fullHeight}
      ${animationStyles.fadeIn}
    `}>
      <div className={`
        ${styles.menuContainer}
        ${themeStyles.glass}
        ${spacingStyles.p6}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
        ${spacingStyles.gap4}
      `}>
        <h2 className={`
          ${typographyStyles.heading2}
          ${spacingStyles.mb4}
        `}>
          Game Options
        </h2>

        <div className={`
          ${styles.optionsGrid}
          ${spacingStyles.gap4}
        `}>
          {Object.entries(options).map(([key, option]) => (
            <div 
              key={key}
              className={`
                ${styles.optionCard}
                ${themeStyles.glass}
                ${spacingStyles.p4}
                ${layoutStyles.flexColumn}
                ${spacingStyles.gap3}
              `}
            >
              <div className={styles.optionHeader}>
                <h3 className={typographyStyles.heading3}>
                  {option.label}
                </h3>
                <p className={`
                  ${typographyStyles.text}
                  ${styles.optionDescription}
                `}>
                  {option.description}
                </p>
              </div>

              <div className={`
                ${styles.optionControls}
                ${layoutStyles.flexRow}
                ${layoutStyles.justifyCenter}
                ${spacingStyles.gap2}
              `}>
                {option.type === 'toggle' ? (
                  <button
                    onClick={() => onOptionChange(key, !option.value)}
                    className={`
                      ${buttonStyles.button}
                      ${option.value ? buttonStyles.secondary : ''}
                      ${styles.optionButton}
                    `}
                  >
                    {option.value ? 'On' : 'Off'}
                  </button>
                ) : (
                  option.values.map((value) => (
                    <button
                      key={value}
                      onClick={() => onOptionChange(key, value)}
                      className={`
                        ${buttonStyles.button}
                        ${value === option.value ? buttonStyles.secondary : ''}
                        ${styles.optionButton}
                      `}
                    >
                      {value}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onBack}
          className={`
            ${buttonStyles.large}
            ${buttonStyles.secondary}
            ${styles.backButton}
            ${spacingStyles.mt4}
          `}
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
} 