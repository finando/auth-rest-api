import env from '../../env';

import type { Configuration } from 'oidc-provider';

const { REALM: realm } = env;

const clients: Configuration['clients'] = [
  {
    realm,
    client_id: `${realm}.development.private`,
    client_secret: `${realm}.development.private`,
    application_type: 'web',
    grant_types: ['authorization_code', 'refresh_token'],
    scope: `openid profile`,
    redirect_uris: ['http://0.0.0.0:8005/auth'],
    post_logout_redirect_uris: [],
    token_endpoint_auth_method: 'none',
    isDevelopment: true,
    isFirstParty: true,
  },
  {
    realm,
    client_id: `${realm}.private`,
    client_secret: `${realm}.private`,
    application_type: 'web',
    grant_types: ['authorization_code', 'refresh_token'],
    scope: `openid profile`,
    redirect_uris: [],
    post_logout_redirect_uris: [],
    token_endpoint_auth_method: 'none',
    isDevelopment: false,
    isFirstParty: true,
  },
];

export default clients;
