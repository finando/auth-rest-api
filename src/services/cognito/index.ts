import env from '@app/env';

import CognitoService from './service';

const {
  AWS_REGION: region,
  AWS_COGNITO_USER_POOL_ID: userPoolId = '',
  AWS_COGNITO_USER_POOL_CLIENT_ID: clientId = ''
} = env;

export default new CognitoService(region, userPoolId, clientId);
