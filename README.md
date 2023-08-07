# TicTacToe (In world)

# Getting Started

This boilerplate is meant to give you a simple starting point to build new features in Topia using our Javascript SDK.

# NOTES

- This repository uses NPM Workspaces
- We use Typescript
- Express for Server app
- Vite based React client app

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
3. We DO want to keep the ts-config files separate, given that we might have different needs for client and server.


### Run in Docker

1. For local development run `docker-compose up`. This runs the client(3001) and server(3000) on separate ports. You can access them separately. They are also setup with auto-build on save.
2. To build an image for delivery run `docker build . -t [add a name]:v[version_number]`. This will generate an image that you can push out to ECR for deployment.
3. To locally run, use the following command.
   ```bash
   docker run -p 3000:3000 -p 3001:3001 -d --env INSTANCE_DOMAIN=api.topia.io --env INTERACTIVE_KEY=eDtTM1wKgP0B39pYidZc --env INTERACTIVE_SECRET=1314f7b5-4ec8-46ba-ac8d-8b0c06e11b3b --env CUSTOM_TEXT=rXLgzCs1wxpx96YLZAN5 --env WEB_IMAGE= --env API_URL=https://ttt.topia-randd.io <image_id>
```

## Add your .env environmental variables

For the server you need to set up environment variables. Copy the `.env-exmaple` file and rename it `.env`.

```yaml
API_URL=https://ttt.topia-randd.io
INSTANCE_DOMAIN=api.topia.io
PUBLIC_KEY=yourkey
PRIVATE_KEY=enteryoursecret

CUSTOM_TEXT=rXLgzCs1wxpx96YLZAN5
WEB_IMAGE=
```

**Developer Note: DO NOT use API_KEY unless absolutely necessary. ASK IN SLACK BEFORE USING**

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)
