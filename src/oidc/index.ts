import env from '@app/env';
import { cognito } from '@app/services';
import {
  isDevelopmentEnvironment,
  isProductionEnvironment
} from '@app/utils/common';
import logger, { serverConfigTags } from '@app/utils/logging';

import DynamoDbAdapter from './adapters/dynamodb';
import claims from './claims';
import clients from './clients';
import cookies from './cookies';
import features from './features';
import interactions from './interactions';
import jwks from './jwks';
import origins from './origins';
import routes from './routes';
import scopes from './scopes';
import ttl from './ttl';

import type { Configuration } from 'oidc-provider';

const {
  NODE_ENV: environment,
  AUTH_INTERACTIONS_URL,
  USE_DEV_INTERACTIONS
} = env;

const tags = [...serverConfigTags, 'oidc'];

export default async (): Promise<Configuration> => ({
  adapter: isDevelopmentEnvironment() ? undefined : DynamoDbAdapter,
  claims,
  clients,
  cookies: await cookies(),
  features,
  interactions,
  jwks: await jwks(),
  routes,
  scopes: Object.values(scopes).flat(),
  ttl,
  rotateRefreshToken: () => true,
  async issueRefreshToken(_, client, code) {
    if (!client.grantTypes?.includes('refresh_token')) {
      return false;
    }

    return (
      code.scopes.has('offline_access') ||
      (client.applicationType === 'web' &&
        client.tokenEndpointAuthMethod === 'none')
    );
  },
  clientBasedCORS(_, origin, client) {
    return (
      origins[environment].includes(origin) &&
      !!clients
        ?.filter(
          ({ isDevelopment }) =>
            (isDevelopmentEnvironment() && isDevelopment) ||
            (isProductionEnvironment() && !isDevelopment)
        )
        .map(({ client_id }) => client_id)
        .includes(client.clientId)
    );
  },
  async findAccount(_, sub) {
    if (USE_DEV_INTERACTIONS) {
      return {
        accountId: sub,
        async claims() {
          return {
            sub,
            name: 'Bobby Ray',
            email: 'user@finando.app',
            phone_number: '+1 (425) 555-1212',
            given_name: 'Bobby',
            family_name: 'Ray',
            picture: 'http://localhost',
            gender: 'male',
            birthdate: '1988-11-15',
            locale: 'en',
            email_verified: true,
            phone_number_verified: false
          };
        }
      };
    }

    try {
      const user = await cognito.findUserByUsername(sub);

      if (user) {
        const {
          username = '',
          attributes: {
            email,
            phone_number,
            given_name,
            family_name,
            picture,
            gender,
            birthdate,
            locale,
            email_verified,
            phone_number_verified
          } = {}
        } = user;

        logger.info('Successfully found account', {
          tags: [...tags, 'find-account', 'success'],
          sub
        });

        return {
          accountId: username,
          async claims() {
            return {
              sub: username,
              name: `${given_name ?? ''} ${family_name ?? ''}`.trim(),
              email,
              phone_number,
              given_name,
              family_name,
              picture,
              gender,
              birthdate,
              locale,
              email_verified,
              phone_number_verified
            };
          }
        };
      }

      throw new Error('User not found');
    } catch (error) {
      logger.error('Error while trying to find account', {
        tags: [...tags, 'find-account', 'error'],
        sub,
        error
      });

      return {
        accountId: sub,
        async claims() {
          return { sub };
        }
      };
    }
  },
  pkce: {
    methods: ['S256'],
    required: function pkceRequired() {
      return true;
    }
  },
  async extraTokenClaims() {
    return undefined;
  },
  async renderError(ctx, out, error) {
    if (out.error && error) {
      logger.error('An error occurred', { tags: [...tags, 'error'], error });

      ctx.redirect(`${AUTH_INTERACTIONS_URL}/error`);
    }
  }
});
