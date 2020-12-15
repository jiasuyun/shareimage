FROM node:14-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add fontconfig \
  && rm -rf /var/cache/apk \
  && mkdir -p /usr/share/fonts \
  && npm ci --only=production

COPY . .

EXPOSE 3000

CMD [ "node", "index.js" ]