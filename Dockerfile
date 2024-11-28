FROM node:22-alpine

WORKDIR /app/client

COPY client .
RUN npm install
RUN npm run build

WORKDIR /app/server
COPY server .

WORKDIR /app
COPY package*.json .

RUN npm install

CMD [ "npm", "start" ]
