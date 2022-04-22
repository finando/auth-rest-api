import { interactionPolicy } from 'oidc-provider';

const { Prompt, Check } = interactionPolicy;

export default new Prompt(
  {
    name: 'email_verification',
    requestable: true
  },
  () => ({}),
  new Check(
    'email_verification_required',
    'Email verification is required',
    async ({ oidc: { session, result, entities } }) => {
      if (session?.accountId) {
        if (result) {
          return !(result?.email_verification as Record<string, any>)?.verified;
        }

        if (entities?.Account) {
          const { email_verified } = await entities.Account.claims(
            'userinfo',
            '',
            {},
            []
          );

          return [false, 'false'].includes(email_verified as string);
        }
      }

      return false;
    }
  )
);
