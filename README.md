# Auth REST API

[![semantic-release: angular](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

## Description

Auth REST API is an OpenID Connect authorization server.

## Installation and Usage

- Required tools to run this project:
  - Node.js and npm to run locally on a host machine
  - Docker and Docker Compose to run locally in a container

#### Running application locally on a host machine

- Install dependencies by running `npm install`
- Run one of the following commands:
  - `npm start` to start local development server
  - `npm run debug` to start local development server in debug mode

#### Running application in a Docker container

- Build a Docker container using the following command:
  - `docker build -t auth-rest-api .`
- Run the container using the following comand:
  - `docker run -d -p 8004:8000 -e NODE_ENV -e HOST -e PORT -e ISSUER -e REALM -e AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY -e AWS_REGION -e AWS_COGNITO_USER_POOL_ID -e AWS_COGNITO_USER_POOL_CLIENT_ID -e OIDC_PROVIDER_DB_TABLE -e USE_DEV_INTERACTIONS -e AUTH_INTERACTIONS_URL auth-rest-api`

#### Running application using Docker Compose

- Run the application using the following command:
  - `docker compose up -d`

## Environment Variables

- `NODE_ENV` - current environment
  - `development`
  - `production`
- `HOST` - application hostname (not necessary)
  - `0.0.0.0` (default)
- `PORT` - application port (not necessary)
  - `8004` (default)
- `ISSUER` - OIDC issuer
  - `http://0.0.0.0:8004` (default in development mode)
  - `https://id.{env}.finando.app` (must be used in production-like environments)
  - `https://id.finando.app` (must be used in production)
- `REALM` - realm name
  - `finando` (default)
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_REGION` - AWS region
  - `eu-north-1` (default)
- `AWS_COGNITO_USER_POOL_ID` - AWS Cognito user pool ID
- `AWS_COGNITO_USER_POOL_CLIENT_ID` - AWS Cognito user pool client ID
- `OIDC_PROVIDER_DB_TABLE` - AWS DynamoDB table name to be used by the adapter
- `USE_DEV_INTERACTIONS` - boolean flag to indicate whether to enable dev interactions
- `AUTH_INTERACTIONS_URL` - auth interactions URL
  - `http://localhost:8005` (default in development)
  - `https://id.{env}.finando.app/interactions` (must be used in production-like environments)
  - `https://id.finando.app/interactions` (must be used in production)

## External Services

#### DynamoDB

Do not forget to set TTL management policy for `expiresAt` field in OIDC provider table.

## Contributing

#### Branching Strategy

Whenever a new change is to be implemented, follow these steps:
  - Create a new branch from the `master` branch
  - Implement and commit changes
  - Create a pull request for code review

#### Commits

This repository uses conventional commmit format. In order to commit, follow these steps:
  - Stage files to be committed
  - Run `npm run commit` script

Avoid using `--no-verify` flag when making commits.
