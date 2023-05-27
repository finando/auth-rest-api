import { SecretsManager, type AWSError } from 'aws-sdk';

import { type AwsRegion } from '@app/enums';
import logger, { serviceTags } from '@app/utils/logging';

const tags = [...serviceTags, 'secrets-manager'];

export default class SecretsManagerService {
  constructor(
    region: AwsRegion,
    private readonly secretsManager: SecretsManager = new SecretsManager({
      region,
    })
  ) {}

  public async getSecret(id: string): Promise<string> {
    try {
      const { SecretString, SecretBinary } = await this.secretsManager
        .getSecretValue({ SecretId: id })
        .promise();

      if (SecretString) {
        return SecretString;
      }

      if (SecretBinary) {
        return Buffer.from(SecretBinary as string, 'base64').toString('ascii');
      }
    } catch (error) {
      throw this.handleError(error);
    }

    return '';
  }

  private handleError(error: AWSError): Error {
    let message = 'An error occurred';

    if (error.code === 'DecryptionFailureException') {
      message = `Secrets Manager can't decrypt the protected secret text using the provided KMS key`;
    } else if (error.code === 'InternalServiceErrorException') {
      message = 'An error occurred on the server side';
    } else if (error.code === 'InvalidParameterException') {
      message = 'An invalid value provided for a parameter';
    } else if (error.code === 'InvalidRequestException') {
      message =
        'Provided parameter value is not valid for the current state of the resource';
    } else if (error.code === 'ResourceNotFoundException') {
      message = `Resource not found`;
    }

    logger.error(message, {
      tags: [...tags, 'error'],
      error,
    });

    return error;
  }
}
