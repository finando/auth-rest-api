import { Environment } from '@app/enums';

export default {
  [Environment.DEVELOPMENT]: ['http://localhost:8005', 'http://0.0.0.0:8005'],
  [Environment.PRODUCTION]: ['https://finando.app']
};
