import { isDevelopmentEnvironment } from '@app/utils/common';
import { getCookieKeys } from '@app/utils/crypto';

import type { Configuration } from 'oidc-provider';

export default async (): Promise<Configuration['cookies']> => ({
  keys: await getCookieKeys(),
  names: {
    interaction: 'OIDC_INTERACTION',
    resume: 'OIDC_INTERACTION_RESUME',
    session: 'OIDC_SESSION',
    state: 'OIDC_STATE'
  },
  short: {
    httpOnly: true,
    overwrite: true,
    sameSite: 'lax',
    signed: true,
    secure: !isDevelopmentEnvironment(),
    path: '/'
  },
  long: {
    httpOnly: true,
    overwrite: true,
    sameSite: 'none',
    signed: true,
    secure: !isDevelopmentEnvironment(),
    path: '/'
  }
});
