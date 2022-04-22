import type { Configuration } from 'oidc-provider';

const claims: Configuration['claims'] = {
  acr: null,
  amr: null,
  azp: null,
  auth_time: null,
  iss: null,
  nbf: null,
  nonce: null,
  openid: ['sub'],
  address: ['address'],
  email: ['email', 'email_verified'],
  phone: ['phone_number', 'phone_number_verified'],
  profile: [
    'birthdate',
    'family_name',
    'gender',
    'given_name',
    'locale',
    'middle_name',
    'name',
    'nickname',
    'picture',
    'preferred_username',
    'profile',
    'updated_at',
    'website',
    'zoneinfo'
  ],
  session_state: null,
  sid: null,
  typ: null
};

export default claims;
