// Board dimensions
export const BOARD_HEIGHT = 600;
export const BOARD_WIDTH = 800;

// Paddle properties
export const PADDLE_HEIGHT = 100;
export const PADDLE_WIDTH = 15;
export const PADDLE_OFFSET = 50;

// Ball properties
export const BALL_SIZE = 15;
export const INITIAL_BALL_SPEED = 300;
export const MAX_BALL_SPEED = INITIAL_BALL_SPEED * 8;

// Physics constants
export const SPEED_MULTIPLIER = 1.2;
export const MAX_SPIN = 1.5;
export const SPIN_DECAY = 0.98;
export const MIN_DELTA_TIME = 16; // minimum time step in ms
export const PHYSICS_THRESHOLD = 0.01; // minimum change threshold for physics updates 