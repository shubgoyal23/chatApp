FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install build dependencies (needed for CGO with mongo driver)
RUN apk --no-cache add gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o worker .

# ---

FROM alpine:3.21

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata \
  && adduser -D -u 1001 appuser

COPY --from=builder /app/worker .
RUN chown appuser:appuser ./worker

USER appuser

EXPOSE 3000

CMD ["./worker"]

