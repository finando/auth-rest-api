export interface CognitoUser {
  username: string;
  attributes: Record<string, string>;
  createdAt: Date;
  lastModifiedAt: Date;
  status: string;
  enabled: boolean;
}

export interface SignInResponse {
  sub?: string;
  emailVerified?: boolean;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  identifier: string;
  password: string;
}

export interface UpdateUserProfileParams {
  firstName: string;
  lastName: string;
  picture: string;
  gender: Gender;
  birthdate: string;
  locale: string;
}

export interface RequestOptions {
  readonly requestId?: string;
}
