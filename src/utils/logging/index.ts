import { createLogger, format, transports } from 'winston';

import { Environment } from '@app/enums';

const { NODE_ENV: environment, npm_package_name: name } = process.env;

const { combine, errors, timestamp, json, prettyPrint } = format;
const { Console } = transports;

export default createLogger({
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    errors({ stack: true }),
    environment === Environment.PRODUCTION ? json() : prettyPrint()
  ),
  transports: [new Console()],
  defaultMeta: {
    service: name
  }
});

export const serverTags: string[] = ['server'];
export const serverConfigTags: string[] = ['server', 'config'];
export const requestTags: string[] = [...serverTags, 'request'];
export const serviceTags: string[] = [...serverTags, 'service'];
export const operationTags: string[] = [...requestTags, 'operation'];
export const directiveTags: string[] = [...requestTags, 'directive'];
export const routeTags: string[] = [...serverTags, 'route'];
export const interactionTags: string[] = [...serverTags, 'interaction'];
