import Provider from 'oidc-provider';

import { ApplicationPhase } from '@app/enums';
import env from '@app/env';

import {
  compression,
  cors,
  crossdomain,
  helmet,
  referrer,
  router,
} from './middleware';
import configuration from './oidc';
import { serverConfiguration, queueListener } from './plugins';

const { ISSUER: issuer } = env;

export default async () =>
  (async () => {
    const provider = new Provider(issuer, await configuration());

    provider.use(compression);
    provider.use(cors);
    provider.use(crossdomain);
    provider.use(helmet);
    provider.use(referrer);
    provider.use(router(provider).routes());

    provider.on(ApplicationPhase.SERVER_START, serverConfiguration);
    provider.on(ApplicationPhase.SERVER_START, queueListener);

    return provider;
  })().then((provider) => {
    provider.emit(ApplicationPhase.SERVER_START);

    return provider;
  });
