# Getting Started

This boilerplate is meant to give you a simple starting point to build new features in Topia using our Javascript SDK.

# NOTES

- This repository uses NPM Workspaces
- 

## Initial Setup

### Setup the npm workspace 

After you have cloned the repository, locate `name` key in the three `package.json` files. Then change the values as the following: 

1. Root file: `[app-name]` Example: `awesome-rnd-magic`
2. `./server/package.json`: `@[app-name]/server` Example: `@awesome-rnd-magic/server`
3. `./client/package.json`: `@[app-name]/client` Example: `@awesome-rnd-magic/client`

If you want to learn more about workspaces https://docs.npmjs.com/cli/v7/using-npm/workspaces

### Install

Run `npm install` or `yarn install` on the root directory.

Notes: 

1. Root package.json is for general/shared dependencies.
2. Client and Server package.json files are for app specific dependencies. 


### Run in Docker

1. For local development run `docker-compose up`. This runs the client(3001) and server(3000) on seperate ports. You can access them seperately. They are also setup with auto-build on save.
2. To build an image for delivery run `docker build . -t [add a name]:v[version_number]`. This will generate an image that you can push out to ECR for deployment.

## Add your .env environmental variables

```json
API_URL=http://localhost:3001
INSTANCE_DOMAIN=api.topia.io
PUBLIC_KEY=yourkey
PRIVATE_KEY=enteryoursecret
```

**Developer Note: DO NOT use API_KEY unless absolutely necessary. ASK BEFORE USING**

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)
