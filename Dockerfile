# This is for production/aws build only

FROM --platform=linux/amd64 node:18-alpine3.17
WORKDIR /usr/app
COPY . ./
RUN npm install
EXPOSE 3000
RUN npm run build:prod
CMD ["npm", "start"]
