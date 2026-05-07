export enum LogLevel {
  TRACE,
  INFO,
  WARN,
  ERROR,
  CRITICAL
}

export class Logger {
  private static getPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.TRACE: return '[TRACE]';
      case LogLevel.INFO: return '[INFO]';
      case LogLevel.WARN: return '[WARN]';
      case LogLevel.ERROR: return '[ERROR]';
      case LogLevel.CRITICAL: return '[CRITICAL]';
      default: return '[UNKNOWN]';
    }
  }

  private static log(level: LogLevel, message: string, ...args: any[]) {
    const prefix = this.getPrefix(level);
    const date = new Date().toISOString();
    const formattedMessage = `${date} ${prefix} ${message}`;

    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.INFO:
        console.log(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(formattedMessage, ...args);
        break;
    }
  }

  static Trace(message: string, ...args: any[]) { this.log(LogLevel.TRACE, message, ...args); }
  static Info(message: string, ...args: any[]) { this.log(LogLevel.INFO, message, ...args); }
  static Warn(message: string, ...args: any[]) { this.log(LogLevel.WARN, message, ...args); }
  static Error(message: string, ...args: any[]) { this.log(LogLevel.ERROR, message, ...args); }
  static Critical(message: string, ...args: any[]) { this.log(LogLevel.CRITICAL, message, ...args); }
}
