import { InteractionErrorCode } from '@app/enums';
import env from '@app/env';
import { cognito } from '@app/services';
import logger, { serverTags } from '@app/utils/logging';

import policy from '../policy';

import type { Configuration } from 'oidc-provider';

const { AUTH_INTERACTIONS_URL: host, USE_DEV_INTERACTIONS } = env;

const tags = [...serverTags, 'interaction'];

const interactions: Configuration['interactions'] = {
  policy,
  url: async ({ oidc: { prompts, session, entities } }, { uid }) => {
    if (USE_DEV_INTERACTIONS) {
      return `/interaction/${uid}`;
    }

    if (session?.accountId && entities?.Account) {
      const { email_verified: emailVerified } = await entities.Account.claims(
        'userinfo',
        '',
        {},
        []
      );

      if ([false, 'false'].includes(emailVerified as string)) {
        if (!prompts.has('signup')) {
          try {
            await cognito.sendConfirmationCode(session.accountId);
          } catch (error) {
            logger.error('Failed to send confirmation code to user', {
              tags: [...tags, 'email_verification', 'error'],
              error,
            });

            return `${host}/error?reason=${InteractionErrorCode.VERIFICATION_CODE_SEND_FAILED}`;
          }
        }

        return `${host}/verify?id=${uid}`;
      }
    }

    if (prompts.has('signup')) {
      return `${host}/sign-up?id=${uid}`;
    }

    return `${host}/sign-in?id=${uid}`;
  },
};

export default interactions;
