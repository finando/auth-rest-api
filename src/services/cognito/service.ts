import { CognitoIdentityServiceProvider, type AWSError } from 'aws-sdk';
import { decodeJwt } from 'jose';

import { type AwsRegion } from '@app/enums';
import logger, { serviceTags } from '@app/utils/logging';

import { type CustomUserAttribute } from './enums';

import type {
  CognitoUser,
  SignInResponse,
  SignUpData,
  UpdateUserProfileParams,
  RequestOptions,
} from './types';

const tags = [...serviceTags, 'cognito'];

export default class CognitoService {
  constructor(
    region: AwsRegion,
    private readonly userPoolId: string,
    private readonly clientId: string,
    private readonly cognito: CognitoIdentityServiceProvider = new CognitoIdentityServiceProvider(
      { region }
    ),
    private readonly customUserAttributes: CustomUserAttribute[] = []
  ) {}

  public async findUserByUsername(
    username: string,
    type?: 'email'
  ): Promise<Partial<CognitoUser> | null> {
    try {
      const { Users: [user] = [] } = await this.cognito
        .listUsers({
          UserPoolId: this.userPoolId,
          Filter: `${type || 'username'} = '${username}'`,
          Limit: 1,
        })
        .promise();

      if (user) {
        logger.info(`User found for username: ${username}`, {
          tags: [...tags, 'success'],
        });

        return this.mapObjectToUser(user);
      }

      logger.warn(`User not found for username: ${username}`, {
        tags: [...tags, 'warning'],
      });

      return null;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async signIn(
    username: string,
    password: string
  ): Promise<SignInResponse> {
    try {
      const { AuthenticationResult } = await this.cognito
        .adminInitiateAuth({
          AuthFlow: 'ADMIN_NO_SRP_AUTH',
          UserPoolId: this.userPoolId,
          ClientId: this.clientId,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
          },
        })
        .promise();

      if (AuthenticationResult?.IdToken) {
        const { sub, email_verified: emailVerified = false } = decodeJwt(
          AuthenticationResult.IdToken
        );

        logger.info(`User with ID: ${sub} successfully authenticated`, {
          tags: [...tags, 'success'],
        });

        return { sub, emailVerified: Boolean(emailVerified) };
      }
      throw new Error('Failed to authenticate user');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async signUp({
    identifier: Username,
    password: Password,
    firstName,
    lastName,
  }: SignUpData): Promise<string> {
    try {
      const { UserSub: id } = await this.cognito
        .signUp({
          ClientId: this.clientId,
          Username,
          Password,
          UserAttributes: [
            {
              Name: 'given_name',
              Value: firstName,
            },
            {
              Name: 'family_name',
              Value: lastName,
            },
          ],
          UserContextData: {
            EncodedData: '',
          },
        })
        .promise();

      if (id) {
        logger.info(`User with ID: ${id} successfully created`, {
          tags: [...tags, 'success'],
        });

        return id;
      }
      throw new Error('Failed to create user');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async sendConfirmationCode(username: string): Promise<void> {
    try {
      const data = await this.cognito
        .resendConfirmationCode({
          ClientId: this.clientId,
          Username: username,
          UserContextData: {
            EncodedData: '',
          },
        })
        .promise();

      if (data) {
        logger.info('Successfully sent confirmation code to user', {
          tags: [...tags, 'success'],
        });
      } else {
        throw new Error('Failed to send confirmation code to user');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async verifyUser(username: string, code: string): Promise<void> {
    try {
      const data = await this.cognito
        .confirmSignUp({
          ClientId: this.clientId,
          Username: username,
          ConfirmationCode: code,
          UserContextData: {
            EncodedData: '',
          },
        })
        .promise();

      if (data) {
        logger.info('Successfully confirmed user registration', {
          tags: [...tags, 'success'],
        });
      } else {
        throw new Error('Failed to confirm user registration');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  public async updateUserProfile(
    username: string,
    params: Partial<UpdateUserProfileParams>,
    options?: RequestOptions
  ): Promise<void> {
    const attributeMapping: Record<string, string> = {
      firstName: 'given_name',
      lastName: 'family_name',
      picture: 'picture',
      gender: 'gender',
      birthdate: 'birthdate',
      locale: 'locale',
    };

    const attributes = Object.entries(params).reduce(
      (previous, [key, value]) => ({
        ...previous,
        ...(value &&
          key in attributeMapping && { [attributeMapping[key]]: value }),
      }),
      {}
    );

    try {
      if (Object.entries(attributes).length > 0) {
        await this.cognito
          .adminUpdateUserAttributes({
            UserPoolId: this.userPoolId,
            Username: username,
            UserAttributes: this.marshallUserAttributes(attributes),
          })
          .promise();

        logger.info(
          `Successfully updated user profile for user with ID: ${username}`,
          {
            tags: [...tags, 'success'],
            ...options,
          }
        );
      }
    } catch (error) {
      throw this.handleError(error, options);
    }
  }

  private mapObjectToUser(
    user: CognitoIdentityServiceProvider.UserType
  ): Partial<CognitoUser> {
    const {
      Attributes: userAttributes = [],
      Enabled: enabled,
      UserCreateDate: createdAt,
      UserLastModifiedDate: lastModifiedAt,
      Username: username,
      UserStatus: status,
    } = user;

    const attributes = this.unmarshallUserAttributes(userAttributes);

    return { username, attributes, createdAt, lastModifiedAt, status, enabled };
  }

  private marshallUserAttributes(
    attributes: Record<string, string>
  ): CognitoIdentityServiceProvider.AttributeListType {
    return Object.entries(attributes).map(([name, value]) => ({
      Name: this.customUserAttributes
        .map((attribute) => attribute.toString())
        .includes(name)
        ? `custom:${name}`
        : name,
      Value: value,
    }));
  }

  private unmarshallUserAttributes(
    attributes: CognitoIdentityServiceProvider.AttributeListType
  ): Record<string, string> {
    return attributes.reduce(
      (previous, { Name: name, Value: value }) => ({
        ...previous,
        [name.startsWith('custom') ? name.replace('custom:', '') : name]: value,
      }),
      {}
    );
  }

  private handleError(error: AWSError, options?: RequestOptions): Error {
    logger.error(error.message, {
      tags: [...tags, 'error'],
      error,
      ...options,
    });

    return error;
  }
}
