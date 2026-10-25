FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# /ping runs after the DB middleware, so this also fails while MongoDB is unreachable.
HEALTHCHECK --start-period=30s --start-interval=2s --interval=30s --timeout=5s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/ping`).then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "src/index.js"]


