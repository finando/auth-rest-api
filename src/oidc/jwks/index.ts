import { getJwks } from '@app/utils/crypto';

import type { Configuration } from 'oidc-provider';

export default async (): Promise<Configuration['jwks']> => getJwks();
