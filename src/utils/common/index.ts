import { Environment } from '@app/enums';
import env from '@app/env';

function assertIsDefined<T>(
  key: string,
  value: T
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`Expected ${key} to be defined, but received ${value}`);
  }
}

export const validateEnvironmentVariables = <T extends object>(env: T): T => {
  Object.entries(env).forEach(([key, value]) => assertIsDefined(key, value));

  return env;
};

export const isDevelopmentEnvironment = (): boolean =>
  env.NODE_ENV === Environment.DEVELOPMENT;

export const isProductionEnvironment = (): boolean =>
  env.NODE_ENV === Environment.PRODUCTION;
