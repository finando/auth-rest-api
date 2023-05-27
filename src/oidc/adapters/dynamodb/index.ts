import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDB } from 'aws-sdk';

import env from '@app/env';
import { isProductionEnvironment } from '@app/utils/common';

const { AWS_REGION: region, OIDC_PROVIDER_DB_TABLE: TableName } = env;

class DynamoDBAdapter {
  constructor(
    private readonly name: string,
    private readonly db = new DynamoDB({
      region,
      sslEnabled: isProductionEnvironment(),
      convertResponseTypes: false,
      paramValidation: false,
    }),
    private readonly marshaller = new Marshaller({ unwrapNumbers: true })
  ) {}

  public async upsert(
    id: string,
    payload: Record<string, string>,
    expiresIn: number
  ): Promise<void> {
    const key = this.key(id);

    if (this.name === 'Session') {
      await this.set(
        this.sessionUidKeyFor(payload.uid),
        { payload: id },
        expiresIn
      );
    }

    const { grantId, userCode } = payload;

    if (grantId) {
      const grantKey = this.grantKeyFor(grantId);
      const grant = (await this.get<string>(grantKey))?.payload;

      await this.set(
        grantKey,
        {
          payload:
            grant && Array.isArray(grant) ? [...grant.slice(-10), key] : [key],
        },
        expiresIn
      );
    }

    if (userCode) {
      await this.set(this.userCodeKeyFor(userCode), { payload: id }, expiresIn);
    }

    await this.set(key, payload, expiresIn);
  }

  public async find(id: string): Promise<Record<string, unknown> | undefined> {
    return this.get(this.key(id));
  }

  public async findByUserCode(
    userCode: string
  ): Promise<Record<string, unknown> | undefined> {
    const id = (await this.get<string>(this.userCodeKeyFor(userCode)))?.payload;

    return id ? this.find(id) : undefined;
  }

  public async findByUid(
    uid: string
  ): Promise<Record<string, unknown> | undefined> {
    const id = (await this.get<string>(this.sessionUidKeyFor(uid)))?.payload;

    return id ? this.find(id) : undefined;
  }

  public async consume(id: string): Promise<void> {
    const marshalledId = this.marshaller.marshallValue(this.key(id));
    const marshalledConsumedAt = this.marshaller.marshallValue(
      Math.floor(Date.now() / 1000)
    );

    if (marshalledId && marshalledConsumedAt) {
      await this.db
        .updateItem({
          TableName,
          Key: { id: marshalledId },
          UpdateExpression: 'set consumedAt = :consumedAt',
          ExpressionAttributeValues: { ':consumedAt': marshalledConsumedAt },
        })
        .promise();
    }
  }

  public async destroy(id: string): Promise<void> {
    await this.remove(this.key(id));
  }

  public async revokeByGrantId(grantId: string): Promise<void> {
    const grantKey = this.grantKeyFor(grantId);
    const grant = (await this.get(grantKey))?.payload;

    if (grant && Array.isArray(grant)) {
      grant.forEach((token) => this.remove(token));

      this.remove(grantKey);
    }
  }

  private async get<Payload, T extends object = { payload: Payload }>(
    key: string
  ): Promise<T | undefined> {
    const marshalledKey = this.marshaller.marshallValue(key);

    if (marshalledKey) {
      const { Item: item } = await this.db
        .getItem({
          TableName,
          Key: {
            id: marshalledKey,
          },
        })
        .promise();

      if (item) {
        return this.marshaller.unmarshallItem(item) as T;
      }
    }

    return undefined;
  }

  private async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.db
      .putItem({
        TableName,
        Item: this.marshaller.marshallItem({
          id: key,
          ...value,
          expiresAt: ttl ? Math.floor(Date.now() / 1000) + ttl : undefined,
        }),
      })
      .promise();
  }

  private async remove(key: string): Promise<void> {
    const marshalledKey = this.marshaller.marshallValue(key);

    if (marshalledKey) {
      await this.db
        .deleteItem({
          TableName,
          Key: {
            id: marshalledKey,
          },
        })
        .promise();
    }
  }

  private key(id: string): string {
    return `${this.name}:${id}`;
  }

  private grantKeyFor(id: string): string {
    return `grant:${id}`;
  }

  private sessionUidKeyFor(id: string): string {
    return `sessionUid:${id}`;
  }

  private userCodeKeyFor(userCode: string): string {
    return `userCode:${userCode}`;
  }
}

export default DynamoDBAdapter;
