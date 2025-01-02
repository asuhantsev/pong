import styles from './index.module.css';

// Layout
export const layout = {
  flexRow: styles.flexRow,
  flexColumn: styles.flexColumn,
  flexCenter: styles.flexCenter,
  itemsCenter: styles.itemsCenter,
  justifyCenter: styles.justifyCenter,
  gap1: styles.gap1,
  gap2: styles.gap2,
  gap3: styles.gap3,
  gap4: styles.gap4,
  gap5: styles.gap5,
  fullWidth: styles.fullWidth,
  fullHeight: styles.fullHeight,
  relative: styles.relative,
  absolute: styles.absolute,
  fixed: styles.fixed,
  inset0: styles.inset0
};

// Spacing
export const spacing = {
  p1: styles.p1,
  p2: styles.p2,
  p3: styles.p3,
  p4: styles.p4,
  p5: styles.p5,
  m1: styles.m1,
  m2: styles.m2,
  m3: styles.m3,
  m4: styles.m4,
  m5: styles.m5
};

// Typography
export const typography = {
  text: styles.text,
  heading1: styles.heading1,
  heading2: styles.heading2,
  heading3: styles.heading3,
  noSelect: styles.noSelect
};

// Animations
export const animations = {
  fadeIn: styles.fadeIn,
  slideIn: styles.slideIn,
  scaleIn: styles.scaleIn,
  pulse: styles.pulse
};

// Buttons
export const buttons = {
  button: styles.button,
  large: styles.large,
  disabled: styles.disabled,
  primary: styles.primary,
  secondary: styles.secondary
};

// Cards
export const cards = {
  card: styles.card,
  glass: styles.glass
};

// Theme
export const theme = {
  light: styles.light,
  dark: styles.dark,
  game: styles.game,
  menu: styles.menu,
  ui: styles.ui
};

// Interactive
export const interactive = {
  pointer: styles.pointer,
  clickable: styles.clickable,
  hoverable: styles.hoverable,
  disabled: styles.disabled
};

// Game Elements
export const game = {
  board: styles.board,
  paddle: styles.paddle,
  ball: styles.ball,
  score: styles.score
};

// Overlays
export const overlays = {
  overlay: styles.overlay,
  modal: styles.modal,
  dialog: styles.dialog,
  tooltip: styles.tooltip
};

// Status
export const status = {
  success: styles.success,
  error: styles.error,
  warning: styles.warning,
  info: styles.info
};

// Export all styles as default for direct import
export default styles; 