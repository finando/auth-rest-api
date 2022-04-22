import env from '@app/env';
import { isDevelopmentEnvironment } from '@app/utils/common';

import type { Configuration } from 'oidc-provider';

const { USE_DEV_INTERACTIONS, AUTH_INTERACTIONS_URL } = env;

const features: Configuration['features'] = {
  introspection: { enabled: true },
  revocation: { enabled: true },
  devInteractions: { enabled: !!USE_DEV_INTERACTIONS },
  rpInitiatedLogout: {
    enabled: true,
    async logoutSource(ctx, form) {
      ctx.set('Content-Security-Policy', "script-src: 'self' 'unsafe-inline'");

      ctx.body = `
        <!DOCTYPE html>
        <html>
          <body>
            ${form}
            <input type="hidden" name="logout" value="yes" form="op.logoutForm" />
            <script>
              document.forms['op.logoutForm'].submit()
            </script>
          </body>
        </html>`;
    },
    async postLogoutSuccessSource(ctx) {
      ctx.redirect(
        isDevelopmentEnvironment()
          ? AUTH_INTERACTIONS_URL
          : 'https://finando.app'
      );
    }
  }
};

export default features;
