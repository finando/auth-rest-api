import { randomBytes } from 'crypto';

import { generateKeyPair, exportJWK } from 'jose';

import env from '@app/env';
import { secretsManager } from '@app/services';
import { isDevelopmentEnvironment } from '@app/utils/common';

import type { JWKS } from 'oidc-provider';

const { AWS_REGION: region, NODE_ENV: environment, REALM: realm } = env;

const generateRuntimeJWKS = async () => {
  const { privateKey } = await generateKeyPair('RS512');

  return { keys: [await exportJWK(privateKey)] };
};

const generateRuntimeCookieKeys = async (): Promise<string[]> => {
  return new Promise(resolve => {
    randomBytes(48, (_, buffer) => resolve([buffer.toString('hex')]));
  });
};

export const getCookieKeys = async (): Promise<string[]> => {
  try {
    if (isDevelopmentEnvironment()) {
      return generateRuntimeCookieKeys();
    } else {
      return JSON.parse(
        await secretsManager.getSecret(
          `${realm}/${region}/${environment}/oidc-cookie-keys`
        )
      );
    }
  } catch (error) {
    return generateRuntimeCookieKeys();
  }
};

export const getJwks = async (): Promise<JWKS> => {
  try {
    if (isDevelopmentEnvironment()) {
      return generateRuntimeJWKS();
    } else {
      return JSON.parse(
        await secretsManager.getSecret(
          `${realm}/${region}/${environment}/oidc-jwks`
        )
      );
    }
  } catch (error) {
    return generateRuntimeJWKS();
  }
};
