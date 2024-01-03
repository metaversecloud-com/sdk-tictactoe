# This is for production/aws build only

FROM --platform=linux/arm64 node:20.10-alpine3.19
WORKDIR /usr/app
COPY . ./
EXPOSE 3000
CMD ["npm", "start"]
