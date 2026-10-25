FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes these into the bundle at build time. CI passes them as build args
# from the repository's Actions variables; a local build without them falls back
# to frontend/.env. Empty args are unset first: Vite lets any defined variable,
# even an empty one, override .env.
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_GIN_URL
RUN for v in VITE_API_URL VITE_WS_URL VITE_GIN_URL; do \
      eval "[ -n \"\${$v:-}\" ]" || unset "$v"; \
    done \
    && npm run build


FROM node:24-alpine

WORKDIR /app

RUN adduser -D -u 1001 appuser \
    && npm install -g serve

COPY --from=builder /app/dist ./dist

USER appuser

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
