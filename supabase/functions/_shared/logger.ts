interface LogData {
  message: string;
  level: 'info' | 'warn' | 'error';
  context?: Record<string, any>;
}

class Logger {
  private log(data: LogData) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data,
    }));
  }

  info(message: string, context?: Record<string, any>) {
    this.log({ message, level: 'info', context });
  }

  warn(message: string, context?: Record<string, any>) {
    this.log({ message, level: 'warn', context });
  }

  error(message: string, context?: Record<string, any>) {
    this.log({ message, level: 'error', context });
  }
}

export const logger = new Logger();