import env from '@app/env';

import SecretsManagerService from './service';

const { AWS_REGION: region } = env;

export default new SecretsManagerService(region);
