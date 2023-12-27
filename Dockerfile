# This is for production/aws build only

FROM --platform=linux/amd64 node:20.10-alpine3.19
WORKDIR /usr/app
COPY . ./
EXPOSE 3000
CMD ["node", "./src/build/index.js"]
