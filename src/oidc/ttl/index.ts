import type { Configuration } from 'oidc-provider';

const ttl: Configuration['ttl'] = {
  AccessToken: 30,
  AuthorizationCode: 10,
  ClientCredentials: undefined,
  DeviceCode: undefined,
  BackchannelAuthenticationRequest: undefined,
  IdToken: 30,
  RefreshToken: 1209600,
  Interaction: 3600,
  Session: 1209600,
  Grant: 1209600
};

export default ttl;
