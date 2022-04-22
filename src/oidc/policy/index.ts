import { interactionPolicy } from 'oidc-provider';

import EmailVerificationPrompt from './prompts/email-verification';
import SignupPrompt from './prompts/signup';

const { base } = interactionPolicy;

const policy = base();

policy.unshift(SignupPrompt);
policy.push(EmailVerificationPrompt);

export default policy;
