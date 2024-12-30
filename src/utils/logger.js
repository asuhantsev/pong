const lastLogTime = {
  global: Date.now(),
  components: {}
};
const LOG_THROTTLE = 250; // 4 updates per second max

function shouldLog(component, level) {
  const now = Date.now();
  
  // Global throttle across all components
  if (now - lastLogTime.global < LOG_THROTTLE) {
    return false;
  }

  // Component specific throttle
  const key = `${component}-${level}`;
  if (!lastLogTime.components[key] || now - lastLogTime.components[key] >= LOG_THROTTLE * 2) {
    lastLogTime.components[key] = now;
    lastLogTime.global = now;
    return true;
  }
  return false;
}

export default class Logger {
  static debug(component, message, data) {
    if (!shouldLog(component, 'debug')) return;
    console.debug(`[${new Date().toISOString()}] [DEBUG] [${component}] ${message}`, data);
  }

  static info(component, message, data) {
    if (!shouldLog(component, 'info')) return;
    console.info(`[${new Date().toISOString()}] [INFO] [${component}] ${message}`, data);
  }

  static warn(component, message, data) {
    // Don't throttle warnings
    console.warn(`[${new Date().toISOString()}] [WARN] [${component}] ${message}`, data);
  }

  static error(component, message, data) {
    // Don't throttle errors
    console.error(`[${new Date().toISOString()}] [ERROR] [${component}] ${message}`, data);
  }
} 