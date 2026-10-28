FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# run as the unprivileged node user; it only needs to write upload temp files
RUN mkdir -p public/temp && chown -R node:node public/temp
USER node

EXPOSE 3000

# /ping reports 503 while MongoDB is unreachable, so this also catches a lost database.
HEALTHCHECK --start-period=30s --start-interval=2s --interval=30s --timeout=5s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}/ping`).then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "src/index.js"]
