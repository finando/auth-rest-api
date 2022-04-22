import type { Configuration } from 'oidc-provider';

const routes: Configuration['routes'] = {
  authorization: '/auth',
  end_session: '/logout',
  introspection: '/token/introspect',
  jwks: '/jwks',
  registration: '/reg',
  revocation: '/token/revoke',
  token: '/token',
  userinfo: '/userinfo'
};

export default routes;
