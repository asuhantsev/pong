const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

class Logger {
  static logs = [];
  static maxLogs = 1000;

  static formatMessage(level, component, message, data) {
    const timestamp = new Date().toISOString();
    const formattedData = data ? JSON.stringify(data, null, 2) : '';
    return `[${timestamp}] [${level}] [${component}] ${message} ${formattedData}`;
  }

  static storeLogs(logEntry) {
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    // Also store in localStorage for persistence
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs));
    } catch (e) {
      // If localStorage is full, clear it and try again
      localStorage.clear();
      localStorage.setItem('app_logs', JSON.stringify(this.logs));
    }
  }

  static debug(component, message, data = null) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      const logEntry = this.formatMessage('DEBUG', component, message, data);
      console.debug(logEntry);
      this.storeLogs(logEntry);
    }
  }

  static info(component, message, data = null) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      const logEntry = this.formatMessage('INFO', component, message, data);
      console.info(logEntry);
      this.storeLogs(logEntry);
    }
  }

  static warn(component, message, data = null) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      const logEntry = this.formatMessage('WARN', component, message, data);
      console.warn(logEntry);
      this.storeLogs(logEntry);
    }
  }

  static error(component, message, data = null) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      const logEntry = this.formatMessage('ERROR', component, message, data);
      console.error(logEntry);
      this.storeLogs(logEntry);
    }
  }

  static getLogs() {
    return this.logs;
  }

  static clearLogs() {
    this.logs = [];
    localStorage.removeItem('app_logs');
  }

  static downloadLogs() {
    const logsBlob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(logsBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pong-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default Logger; 