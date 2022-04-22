import logger, { serverTags } from '@app/utils/logging';

import env from './env';
import server from './server';

const { NODE_ENV: environment, HOST: host, PORT: port } = env;

(async () =>
  (await server()).listen({ port, host }, () =>
    logger.info(
      `Application is running at http://${host}:${port}/ in ${environment} mode`,
      { tags: [...serverTags, 'start'] }
    )
  ))();
