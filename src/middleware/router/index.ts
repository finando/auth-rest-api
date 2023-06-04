import Router from '@koa/router';

import { InteractionErrorCode } from '@app/enums';
import env from '@app/env';
import { cognito } from '@app/services';
import logger, { routeTags } from '@app/utils/logging';

import cookieSettings from '../../oidc/cookies';
import body from '../body';

import type Provider from 'oidc-provider';

const { AUTH_INTERACTIONS_URL: host, USE_DEV_INTERACTIONS } = env;

const interactionRouteTags = [...routeTags, 'interaction'];

export default (provider: Provider) => {
  const router = new Router();

  router.get('/favicon.ico', (ctx) => {
    ctx.respond = false;
  });

  router.all('(.*)', async (ctx, next) => {
    await next();

    if ([400, 404].includes(ctx.status) && !USE_DEV_INTERACTIONS) {
      ctx.redirect(host);
    }
  });

  router.post('/interaction/:uid', body, async (ctx, next) => {
    const {
      prompt: { name: promptName, details },
      session,
      grantId,
      params,
    } = await provider.interactionDetails(ctx.req, ctx.res);

    const client = await provider.Client.find(
      (params?.client_id ?? '') as string
    );

    logger.info('Submitting interaction', {
      tags: [...interactionRouteTags, 'submit'],
      prompt: promptName,
    });

    switch (promptName) {
      case 'login': {
        try {
          const { login: identifier, password } = ctx.request.body;

          const { sub: accountId, emailVerified } = USE_DEV_INTERACTIONS
            ? { sub: identifier, emailVerified: true }
            : await cognito.signIn(identifier, password);

          if (accountId) {
            const cookies = await cookieSettings();

            ctx.cookies.set(
              `${(cookies?.names as any)?.returningUser}-${accountId}`,
              accountId,
              {
                ...(cookies?.long ?? {}),
                sameSite: false,
              }
            );
          }
          if (accountId) {
            return provider.interactionFinished(
              ctx.req,
              ctx.res,
              {
                login: { accountId },
                consent: {},
                email_verification: {
                  verified: emailVerified,
                },
              },
              { mergeWithLastSubmission: false }
            );
          }
        } catch (error) {
          if (error?.code === 'UserNotConfirmedException') {
            try {
              logger.info('User is not confirmed - continue to verification', {
                tags: [...interactionRouteTags, 'submit'],
                prompt: promptName,
              });

              const user = await cognito.findUserByUsername(
                (ctx.request as any).body.identifier,
                'email'
              );

              if (user) {
                const { username: accountId = '' } = user;

                return provider.interactionFinished(
                  ctx.req,
                  ctx.res,
                  {
                    login: { accountId },
                    consent: {},
                    email_verification: {
                      verified: false,
                    },
                  },
                  { mergeWithLastSubmission: false }
                );
              }
            } catch (eror) {
              logger.error(error.message, {
                tags: [...interactionRouteTags, 'submit', 'error'],
                prompt: promptName,
                error,
              });
            }
          }
          logger.error('Error submitting interaction', {
            tags: [...interactionRouteTags, 'submit', 'error'],
            prompt: promptName,
            error,
          });
        }

        return ctx.redirect(`${host}/error`);
      }
      case 'consent': {
        const grant =
          (grantId && (await provider.Grant.find(grantId))) ||
          new provider.Grant({
            accountId: session?.accountId,
            clientId: client?.clientId,
          });

        if (details.missingOIDCScope) {
          grant.addOIDCScope((details as any).missingOIDCScope.join(' '));
        }

        if (details.missingOIDCClaims) {
          grant.addOIDCClaims((details as any).missingOIDCClaims);
        }

        Object.entries((details as any).missingResourceScopes ?? {}).forEach(
          ([indicator, scope]) =>
            grant.addResourceScope(indicator, (scope as any).join(' '))
        );

        return provider.interactionFinished(
          ctx.req,
          ctx.res,
          { consent: { grantId: await grant.save() } },
          {
            mergeWithLastSubmission: true,
          }
        );
      }
      case 'signup': {
        try {
          const { identifier, password, passwordRepeat, firstName, lastName } =
            ctx.request.body;

          if (!identifier) {
            logger.error('Invalid identifier', {
              tags: [...interactionRouteTags, 'submit', 'error'],
              prompt: promptName,
            });

            return ctx.redirect(
              `${host}/error?reason=${InteractionErrorCode.INVALID_IDENTIFIER}`
            );
          }

          if (password !== passwordRepeat) {
            logger.error('Password mismatch', {
              tags: [...interactionRouteTags, 'submit', 'error'],
              prompt: promptName,
            });

            return ctx.redirect(
              `${host}/error?reason=${InteractionErrorCode.PASSWORD_MISMATCH}`
            );
          }

          const accountId = await cognito.signUp({
            identifier,
            password,
            firstName,
            lastName,
          });

          return accountId
            ? provider.interactionFinished(ctx.req, ctx.res, {
                login: { accountId },
                consent: {},
                signup: { success: true },
                email_verification: {
                  verified: false,
                },
              })
            : next();
        } catch (error) {
          if (error?.code === 'UsernameExistsException') {
            logger.error(error.message, {
              tags: [...interactionRouteTags, 'submit', 'error'],
              error,
            });

            return ctx.redirect(
              `${host}/error?reason=${InteractionErrorCode.USERNAME_EXISTS}`
            );
          }

          logger.error('Error submitting interaction', {
            tags: [...interactionRouteTags, 'submit', 'error'],
            prompt: promptName,
            error,
          });
        }

        return ctx.redirect(`${host}/error`);
      }
      case 'email_verification': {
        try {
          if (session) {
            const { code = '' } = ctx.request.body;

            if (code) {
              const username =
                typeof session?.accountId === 'string'
                  ? session?.accountId
                  : '';

              await cognito.verifyUser(username, code);

              return provider.interactionFinished(
                ctx.req,
                ctx.res,
                {
                  email_verification: {
                    verified: true,
                  },
                },
                { mergeWithLastSubmission: true }
              );
            }

            logger.error('Did not recieve verification code in request body', {
              tags: [...interactionRouteTags, 'submit', 'error'],
              prompt: promptName,
            });

            return ctx.redirect(
              `${host}/error?reason=${InteractionErrorCode.INVALID_VERIFICATION_CODE}`
            );
          }

          if (!session) {
            logger.error('User session not found', {
              tags: [...interactionRouteTags, 'submit', 'error'],
              prompt: promptName,
            });

            return ctx.redirect(
              `${host}/error?reason=${InteractionErrorCode.SESSION_EXPIRED}`
            );
          }

          return ctx.redirect(`${host}/error`);
        } catch (error) {
          if (error?.code === 'CodeMismatchException') {
            logger.error(error.message, {
              tags: [...interactionRouteTags, 'submit', 'error'],
              prompt: promptName,
              error,
            });

            return ctx.redirect(
              `${host}/error?reason=${InteractionErrorCode.INVALID_VERIFICATION_CODE}`
            );
          }

          if (error?.code === 'ExpiredCodeException') {
            logger.error(error.message, {
              tags: [...interactionRouteTags, 'submit', 'error'],
              prompt: promptName,
              error,
            });

            return ctx.redirect(
              `${host}/error?reason=${InteractionErrorCode.CODE_EXPIRED}`
            );
          }

          logger.error('Error submitting interaction', {
            tags: [...interactionRouteTags, 'submit', 'error'],
            prompt: promptName,
            error,
          });

          return ctx.redirect(`${host}/error`);
        }
      }
      default: {
        return next();
      }
    }
  });

  return router;
};
