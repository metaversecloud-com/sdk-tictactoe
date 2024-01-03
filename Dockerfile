# This is for production/aws build only

FROM --platform=linux/arm64 node:18.16-alpine3.18
WORKDIR /usr/app
COPY . ./
EXPOSE 3000
CMD ["npm", "start"]
