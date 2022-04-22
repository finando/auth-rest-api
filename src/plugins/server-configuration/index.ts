import env from '@app/env';
import logger, { serverConfigTags } from '@app/utils/logging';

const { ISSUER: issuer, NODE_ENV: environment } = env;

export default () => {
  logger.info(`Issuer is set to ${issuer} in ${environment} mode`, {
    tags: [...serverConfigTags, 'issuer']
  });
};
