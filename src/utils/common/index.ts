import { env } from 'process';

import { Environment } from '@app/enums';

function assertIsDefined<T>(
  key: string,
  value: T
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`Expected ${key} to be defined, but received ${value}`);
  }
}

export const validateEnvironmentVariables = <T extends object>(
  envObj: T
): T => {
  Object.entries(envObj).forEach(([key, value]) => assertIsDefined(key, value));

  return envObj;
};

export const isDevelopmentEnvironment = (): boolean =>
  env.NODE_ENV === Environment.DEVELOPMENT;

export const isProductionEnvironment = (): boolean =>
  env.NODE_ENV === Environment.PRODUCTION;
