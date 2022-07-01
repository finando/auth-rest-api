import { Environment, AwsRegion } from '@app/enums';
import { validateEnvironmentVariables } from '@app/utils/common';

const {
  NODE_ENV = Environment.DEVELOPMENT,
  HOST = '0.0.0.0',
  PORT = 8004,
  ISSUER = `http://${HOST}:${PORT}`,
  REALM = 'finando',
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION = AwsRegion.EU_WEST_1,
  AWS_COGNITO_USER_POOL_ID,
  AWS_COGNITO_USER_POOL_CLIENT_ID,
  OIDC_PROVIDER_DB_TABLE = `${REALM}-${AWS_REGION}-${NODE_ENV}-oidc-provider`,
  USE_DEV_INTERACTIONS = false,
  AUTH_INTERACTIONS_URL = 'http://0.0.0.0:8005'
} = process.env;

export default validateEnvironmentVariables({
  NODE_ENV:
    NODE_ENV === Environment.DEVELOPMENT
      ? Environment.DEVELOPMENT
      : Environment.PRODUCTION,
  HOST,
  PORT: Number(PORT),
  ISSUER,
  REALM,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION: AWS_REGION as AwsRegion,
  AWS_COGNITO_USER_POOL_ID,
  AWS_COGNITO_USER_POOL_CLIENT_ID,
  OIDC_PROVIDER_DB_TABLE,
  USE_DEV_INTERACTIONS: ['true', true].includes(USE_DEV_INTERACTIONS),
  AUTH_INTERACTIONS_URL
});
