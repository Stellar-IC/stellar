import * as log from 'loglevel';
import prefix from 'loglevel-plugin-prefix';
import chalk, { ChalkInstance } from 'chalk';

log.setDefaultLevel(log.levels.INFO);

prefix.reg(log);
prefix.apply(log);

const colors: Record<string, ChalkInstance> = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
};

prefix.apply(log, {
  format(level, name, timestamp) {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](
      level
    )} ${chalk.green(`${name}:`)}`;
  },
});

export const logger = log;
