FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# # Vite bakes these into the bundle at build time; they come from docker-compose build args
# # and take precedence over frontend/.env
# ARG VITE_API_URL
# ARG VITE_WS_URL
# ARG VITE_GIN_URL
# ENV VITE_API_URL=$VITE_API_URL \
#     VITE_WS_URL=$VITE_WS_URL \
#     VITE_GIN_URL=$VITE_GIN_URL

RUN npm run build


FROM node:24-alpine

WORKDIR /app

RUN adduser -D -u 1001 appuser \
    && npm install -g serve

COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]