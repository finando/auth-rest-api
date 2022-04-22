export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production'
}

export enum AwsRegion {
  EU_NORTH_1 = 'eu-north-1'
}

export enum ApplicationPhase {
  SERVER_START = 'server_start'
}

export enum InteractionErrorCode {
  INVALID_IDENTIFIER = 'invalid_identifier',
  PASSWORD_MISMATCH = 'password_mismatch',
  USERNAME_EXISTS = 'username_exists',
  INVALID_VERIFICATION_CODE = 'invalid_verification_code',
  SESSION_EXPIRED = 'session_expired',
  CODE_EXPIRED = 'code_expired',
  VERIFICATION_CODE_SEND_FAILED = 'verification_code_send_failed'
}
