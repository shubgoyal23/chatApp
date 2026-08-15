FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:24-alpine

WORKDIR /app

RUN adduser -D -u 1001 appuser \
    && npm install -g serve

COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]