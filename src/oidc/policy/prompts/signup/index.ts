import { interactionPolicy } from 'oidc-provider';

const { Prompt, Check } = interactionPolicy;

export default new Prompt(
  {
    name: 'signup',
    requestable: true
  },
  () => ({}),
  new Check(
    'signup_requested',
    'Signup requested using signup prompt value',
    ({ oidc: { prompts, session } }) =>
      session?.accountId ? false : prompts.has('signup')
  )
);
