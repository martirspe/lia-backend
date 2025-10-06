import { Logger } from '@nestjs/common';
import pino from 'pino';

export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class PinoLogger extends Logger {
  log(message: string) {
    logger.info(message);
  }
  error(message: string, trace?: string) {
    logger.error({ trace }, message);
  }
  warn(message: string) {
    logger.warn(message);
  }
}
