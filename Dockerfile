FROM node:18-alpine

ARG DEPLOY_KEY

RUN apk add --no-cache jq

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
RUN yarn graph auth --studio "${DEPLOY_KEY}"
COPY . .
ENTRYPOINT [ "yarn" ]